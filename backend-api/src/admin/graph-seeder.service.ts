import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface GraphNodeOptionInput {
  text: string;
  next_node_id: string | null;
}

export interface GraphNodeInput {
  question_text: string;
  title?: string | null;
  description?: string | null;
  is_optional?: boolean;
  submit_action?: string | null;
  notes?: string | null;
  input_type: string;
  options?: GraphNodeOptionInput[];
  next_node_id?: string | null;
}

export interface GraphKnowledgeBase {
  category_routes?: Record<string, { start_node_id: string }>;
  nodes?: Record<string, GraphNodeInput>;
  service_category?: string;
  steps?: Record<string, any>;
}

@Injectable()
export class GraphSeederService {
  private readonly logger = new Logger(GraphSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse and upsert a JSON knowledge base structure into the Graph engine.
   */
  async ingestGraphConfig(config: GraphKnowledgeBase) {
    this.logger.log(`Starting graph ingestion...`);
    
    let category_routes = config.category_routes || {};
    let nodes = config.nodes || {};

    if (config.steps) {
      this.logger.log(`Detected new 'steps' format JSON...`);
      nodes = {};
      category_routes = {};
      
      const catStr = config.service_category || 'unknown';
      const trMap: Record<string, string> = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
      const catSlug = catStr.toLowerCase().replace(/[çğıöşü]/g, (m) => trMap[m]).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const firstStepId = Object.keys(config.steps)[0] || '1';
      category_routes[catSlug] = { start_node_id: firstStepId };

      for (const [stepId, stepData] of Object.entries(config.steps)) {
        const inputType = stepData.type === 'single_select' ? 'single_choice' : 
                          stepData.type === 'multi_select' ? 'multi_choice' : 
                          stepData.type || 'text';
                          
        nodes[stepId] = {
          question_text: stepData.question || '',
          title: stepData.title || null,
          description: stepData.description || null,
          is_optional: stepData.is_optional || false,
          submit_action: stepData.submit_action || null,
          notes: stepData.notes || stepData.global_steps_notes || null,
          input_type: inputType,
          next_node_id: stepData.next_step || null,
          options: stepData.options ? stepData.options.map((opt: any) => ({
            text: opt.label,
            next_node_id: opt.next_step
          })) : []
        };
      }
    }

    // 1. Upsert Nodes
    for (const [nodeId, nodeData] of Object.entries(nodes)) {
      await this.prisma.$transaction(async (tx) => {
        // Upsert the main node
        await tx.graphNode.upsert({
          where: { id: nodeId },
          update: {
            question_text: nodeData.question_text,
            title: nodeData.title || null,
            description: nodeData.description || null,
            is_optional: nodeData.is_optional || false,
            submit_action: nodeData.submit_action || null,
            notes: nodeData.notes || null,
            input_type: nodeData.input_type,
            next_node_id: nodeData.next_node_id || null,
          },
          create: {
            id: nodeId,
            question_text: nodeData.question_text,
            title: nodeData.title || null,
            description: nodeData.description || null,
            is_optional: nodeData.is_optional || false,
            submit_action: nodeData.submit_action || null,
            notes: nodeData.notes || null,
            input_type: nodeData.input_type,
            next_node_id: nodeData.next_node_id || null,
          },
        });

        // Delete existing options to recreate them fresh
        await tx.graphNodeOption.deleteMany({
          where: { node_id: nodeId },
        });

        // Recreate options
        if (nodeData.options && nodeData.options.length > 0) {
          await tx.graphNodeOption.createMany({
            data: nodeData.options.map(opt => ({
              node_id: nodeId,
              text: opt.text,
              next_node_id: opt.next_node_id && opt.next_node_id !== 'none' ? opt.next_node_id : null,
            })),
          });
        }
      });
      this.logger.debug(`Upserted node: ${nodeId}`);
    }

    // 2. Upsert Category Routes
    if (category_routes) {
      for (const [categorySlug, routeData] of Object.entries(category_routes)) {
        await this.prisma.graphCategoryRoute.upsert({
          where: { category_slug: categorySlug },
          update: { start_node_id: routeData.start_node_id },
          create: {
            category_slug: categorySlug,
            start_node_id: routeData.start_node_id,
          },
        });
        this.logger.debug(`Upserted route for category: ${categorySlug}`);
      }
    }

    this.logger.log(`Graph ingestion completed successfully!`);
    return { success: true, message: 'Graph config successfully ingested' };
  }

  /**
   * Load JSON file directly from sector_knowledge_base path
   */
  async loadFromFile(filename: string) {
    const filePath = path.join(process.cwd(), 'sector_knowledge_base', filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Knowledge base file not found: ${filename}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed: GraphKnowledgeBase = JSON.parse(fileContent);

    return this.ingestGraphConfig(parsed);
  }
}
