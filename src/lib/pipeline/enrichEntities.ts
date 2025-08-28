import { generateEntityDescription } from "@/lib/llm/generateEntityDescription";

export async function enrichEntities(entities: any[]) {
  if (!entities || entities.length === 0) {
    return [];
  }
  
  try {
    return await Promise.all(
      entities.map(async (entity) => {
        try {
          const description = await generateEntityDescription(entity.name, entity.parentName);
          return {
            ...entity,
            description,
            relationshipLabel: entity.relationshipLabel || "Owned by",
          };
        } catch (error) {
          console.error("Failed to enrich entity:", entity.name, error);
          return {
            ...entity,
            description: `${entity.name} is a company with ownership information available.`,
            relationshipLabel: entity.relationshipLabel || "Owned by",
          };
        }
      })
    );
  } catch (error) {
    console.error("Failed to enrich entities:", error);
    // Return entities without LLM enrichment as fallback
    return entities.map(entity => ({
      ...entity,
      description: `${entity.name} is a company with ownership information available.`,
      relationshipLabel: entity.relationshipLabel || "Owned by",
    }));
  }
} 