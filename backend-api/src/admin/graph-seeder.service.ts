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
  async ingestGraphConfig(config: GraphKnowledgeBase, fileName?: string) {
    this.logger.log(`Starting graph ingestion...`);
    
    let category_routes = config.category_routes || {};
    let nodes = config.nodes || {};

    const rootKeys = Object.keys(config);
    const possibleCategoryKey = rootKeys.find(k => k !== 'category_routes' && k !== 'nodes' && k !== 'service_category' && k !== 'steps' && typeof (config as any)[k] === 'object' && ((config as any)[k].steps || (config as any)[k].nodes));

    if (Object.keys(category_routes).length > 0 && Object.keys(nodes).length > 0 && !possibleCategoryKey && !config.steps) {
      // Legacy format: namespace nodes using the first category slug
      const catSlug = Object.keys(category_routes)[0];
      const newNodes: Record<string, any> = {};
      
      category_routes[catSlug].start_node_id = `${catSlug}_${category_routes[catSlug].start_node_id}`;
      
      for (const [nodeId, nodeData] of Object.entries(nodes)) {
        const namespacedStepId = `${catSlug}_${nodeId}`;
        const nextNodeRaw = nodeData.next_node_id;
        
        newNodes[namespacedStepId] = {
          ...nodeData,
          next_node_id: nextNodeRaw ? `${catSlug}_${nextNodeRaw}` : null,
          options: nodeData.options ? nodeData.options.map((opt: any) => ({
            ...opt,
            next_node_id: opt.next_node_id && String(opt.next_node_id) !== 'none' ? `${catSlug}_${opt.next_node_id}` : null
          })) : []
        };
      }
      nodes = newNodes;
    } else if (possibleCategoryKey) {
      this.logger.log(`Detected nested category format JSON for slug: ${possibleCategoryKey}`);
      const categoryData = (config as any)[possibleCategoryKey];
      const stepsObj = categoryData.steps || categoryData.nodes || {};
      const firstStepIdRaw = categoryData.start_node_id || Object.keys(stepsObj)[0] || '1';
      category_routes[possibleCategoryKey] = { start_node_id: `${possibleCategoryKey}_${firstStepIdRaw}` };
      
      const stepKeys = Object.keys(stepsObj);
      for (let i = 0; i < stepKeys.length; i++) {
        const stepId = stepKeys[i];
        const stepData = stepsObj[stepId];
        const nextStepIdDefault = i + 1 < stepKeys.length ? stepKeys[i + 1] : null;

        const inputType = stepData.type === 'single_select' ? 'single_choice' : 
                          stepData.type === 'multi_select' ? 'multi_choice' : 
                          stepData.type || stepData.input_type || 'text';
        
        const namespacedStepId = `${possibleCategoryKey}_${stepId}`;
        const rawNext = stepData.next_step || stepData.nextStep || stepData.next_node_id || stepData.nextNodeId || stepData.next || stepData.sonraki_adim || stepData.sonrakiAdim || stepData.sonraki || stepData.hedef || stepData.target || stepData.goto || nextStepIdDefault;
        let nextNodeRaw = rawNext !== undefined && rawNext !== null ? String(rawNext) : null;
        if (nextNodeRaw && nextNodeRaw.startsWith(`${possibleCategoryKey}_`)) {
            nextNodeRaw = nextNodeRaw.replace(`${possibleCategoryKey}_`, '');
        }
        
        nodes[namespacedStepId] = {
          question_text: stepData.question || stepData.question_text || stepData.questionText || '',
          title: stepData.title || null,
          description: stepData.description || null,
          is_optional: stepData.is_optional || stepData.isOptional || false,
          submit_action: stepData.submit_action || stepData.submitAction || null,
          notes: stepData.notes || stepData.global_steps_notes || null,
          input_type: inputType,
          next_node_id: nextNodeRaw && nextNodeRaw !== 'none' ? `${possibleCategoryKey}_${nextNodeRaw}` : null,
          options: stepData.options ? stepData.options.map((opt: any) => {
            const optRawNext = opt.next_step || opt.nextStep || opt.next_node_id || opt.nextNodeId || opt.next || opt.sonraki_adim || opt.sonrakiAdim || opt.sonraki || opt.hedef || opt.target || opt.goto;
            let optNextRaw = optRawNext !== undefined && optRawNext !== null ? String(optRawNext) : null;
            if (!optNextRaw && nextNodeRaw) {
               optNextRaw = nextNodeRaw;
            }
            if (optNextRaw && optNextRaw.startsWith(`${possibleCategoryKey}_`)) {
                optNextRaw = optNextRaw.replace(`${possibleCategoryKey}_`, '');
            }
            return {
              text: opt.label || opt.text || opt.value || opt.name,
              next_node_id: optNextRaw && optNextRaw !== 'none' ? `${possibleCategoryKey}_${optNextRaw}` : null
            };
          }) : []
        };
      }
    } else if (config.steps) {
      this.logger.log(`Detected new 'steps' format JSON...`);
      nodes = {};
      category_routes = {};
      
      const fileSlug = fileName ? fileName.replace(/\.json$/i, '') : null;
      const catStr = config.service_category || fileSlug || 'unknown';
      const trMap: Record<string, string> = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
      const catSlug = catStr.toLowerCase().replace(/[çğıöşü]/g, (m) => trMap[m]).replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const firstStepIdRaw = Object.keys(config.steps)[0] || '1';
      category_routes[catSlug] = { start_node_id: `${catSlug}_${firstStepIdRaw}` };
      
      const stepKeys = Object.keys(config.steps);
      
      for (let i = 0; i < stepKeys.length; i++) {
        const stepId = stepKeys[i];
        const stepData = config.steps[stepId];
        const nextStepIdDefault = i + 1 < stepKeys.length ? stepKeys[i + 1] : null;

        const inputType = stepData.type === 'single_select' ? 'single_choice' : 
                          stepData.type === 'multi_select' ? 'multi_choice' : 
                          stepData.type || stepData.input_type || stepData.inputType || 'text';
                          
        const namespacedStepId = `${catSlug}_${stepId}`;
        const rawNext = stepData.next_step || stepData.nextStep || stepData.next_node_id || stepData.nextNodeId || stepData.next || stepData.sonraki_adim || stepData.sonrakiAdim || stepData.sonraki || stepData.hedef || stepData.target || stepData.goto || nextStepIdDefault;
        let nextNodeRaw = rawNext !== undefined && rawNext !== null ? String(rawNext) : null;
        if (nextNodeRaw && nextNodeRaw.startsWith(`${catSlug}_`)) {
            nextNodeRaw = nextNodeRaw.replace(`${catSlug}_`, '');
        }
        
        nodes[namespacedStepId] = {
          question_text: stepData.question || stepData.question_text || stepData.questionText || '',
          title: stepData.title || null,
          description: stepData.description || null,
          is_optional: stepData.is_optional || stepData.isOptional || false,
          submit_action: stepData.submit_action || stepData.submitAction || null,
          notes: stepData.notes || stepData.global_steps_notes || null,
          input_type: inputType,
          next_node_id: nextNodeRaw && nextNodeRaw !== 'none' ? `${catSlug}_${nextNodeRaw}` : null,
          options: stepData.options ? stepData.options.map((opt: any) => {
            const optRawNext = opt.next_step || opt.nextStep || opt.next_node_id || opt.nextNodeId || opt.next || opt.sonraki_adim || opt.sonrakiAdim || opt.sonraki || opt.hedef || opt.target || opt.goto;
            let optNextRaw = optRawNext !== undefined && optRawNext !== null ? String(optRawNext) : null;
            if (!optNextRaw && nextNodeRaw) {
               optNextRaw = nextNodeRaw;
            }
            if (optNextRaw && optNextRaw.startsWith(`${catSlug}_`)) {
                optNextRaw = optNextRaw.replace(`${catSlug}_`, '');
            }
            return {
              text: opt.label || opt.text || opt.value || opt.name,
              next_node_id: optNextRaw && optNextRaw !== 'none' ? `${catSlug}_${optNextRaw}` : null
            };
          }) : []
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
            next_node_id: nodeData.next_node_id !== undefined && nodeData.next_node_id !== null ? String(nodeData.next_node_id) : null,
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
            next_node_id: nodeData.next_node_id !== undefined && nodeData.next_node_id !== null ? String(nodeData.next_node_id) : null,
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
              next_node_id: opt.next_node_id !== undefined && opt.next_node_id !== null && String(opt.next_node_id) !== 'none' ? String(opt.next_node_id) : null,
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
        
        // ALIAS MAPPING: Frontend 'Ev Temizliği' butonu ev-temizligi gönderdiği için ona da aynı düğümü atıyoruz.
        if (categorySlug === 'temizlik-hizmetleri') {
          await this.prisma.graphCategoryRoute.upsert({
            where: { category_slug: 'ev-temizligi' },
            update: { start_node_id: routeData.start_node_id },
            create: { category_slug: 'ev-temizligi', start_node_id: routeData.start_node_id }
          });
        }
        this.logger.debug(`Upserted route for category: ${categorySlug}`);
      }
    }

    if (fileName) {
      const parsedCategorySlug = Object.keys(category_routes)[0] || 'genel';
      await this.prisma.graphUploadLog.create({
        data: {
          file_name: fileName,
          category_slug: parsedCategorySlug
        }
      });
      this.logger.log(`Logged graph upload: ${fileName} for category: ${parsedCategorySlug}`);
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
