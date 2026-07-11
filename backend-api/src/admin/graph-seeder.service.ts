import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface GraphNodeOptionInput {
  text: string;
  next_node_id: string | null;
}

export interface GraphNodeInput {
  question_text: string;
  input_type: string;
  options?: GraphNodeOptionInput[];
  next_node_id?: string | null;
}

export interface GraphKnowledgeBase {
  category_routes: Record<string, { start_node_id: string }>;
  nodes: Record<string, GraphNodeInput>;
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
    
    const { category_routes, nodes } = config;

    // 1. Upsert Nodes
    for (const [nodeId, nodeData] of Object.entries(nodes)) {
      await this.prisma.$transaction(async (tx) => {
        // Upsert the main node
        await tx.graphNode.upsert({
          where: { id: nodeId },
          update: {
            question_text: nodeData.question_text,
            input_type: nodeData.input_type,
            next_node_id: nodeData.next_node_id || null,
          },
          create: {
            id: nodeId,
            question_text: nodeData.question_text,
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
