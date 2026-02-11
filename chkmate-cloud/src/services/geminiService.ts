import { GoogleGenAI, Type } from "@google/genai";
import { CloudProvider, InfrastructurePlan } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const generateInfrastructurePlan = async (
  prompt: string,
  provider: CloudProvider
): Promise<Omit<InfrastructurePlan, 'id' | 'createdAt'>> => {

  const modelId = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are a Senior DevOps Engineer and Solutions Architect. 
    Your goal is to generate Terraform infrastructure configurations based on user prompts.
    
    You must return a structured JSON response containing:
    1. A valid Terraform HCL code snippet.
    2. A monthly cost estimate in USD.
    3. A breakdown of individual resources and their estimated costs.
    4. A graph representation (nodes and links) for visualization.
    
    For the graph:
    - Nodes represent resources (EC2, S3, RDS, VNet, etc.).
    - Links represent logical connections (e.g., EC2 inside Subnet, Load Balancer pointing to Auto Scaling Group).
    
    Be realistic with cost estimates. Use standard resource types for the requested provider (${provider}).
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a ${provider} infrastructure for: ${prompt}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "A short, slug-like name for the architecture" },
            terraformCode: { type: Type.STRING, description: "The full Terraform HCL code" },
            costEstimate: { type: Type.NUMBER, description: "Total estimated monthly cost in USD" },
            resources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, description: "Resource type e.g. aws_instance" },
                  cost: { type: Type.NUMBER, description: "Estimated individual cost" }
                }
              }
            },
            architecture: {
              type: Type.OBJECT,
              properties: {
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      type: { type: Type.STRING, description: "Category: compute, storage, database, network, security" },
                      details: { type: Type.STRING }
                    }
                  }
                },
                links: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      source: { type: Type.STRING, description: "ID of source node" },
                      target: { type: Type.STRING, description: "ID of target node" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    let data;
    try {
       data = JSON.parse(text);
    } catch (e) {
       console.error("JSON Parse Error", e);
       throw new Error("Failed to parse AI response");
    }
    
    return {
      name: data.name || "Untitled Infrastructure",
      provider: provider,
      prompt: prompt,
      terraformCode: data.terraformCode || "# No code generated",
      costEstimate: data.costEstimate || 0,
      resources: data.resources || [],
      architecture: {
        nodes: data.architecture?.nodes || [],
        links: data.architecture?.links || []
      }
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate infrastructure plan. Please try again.");
  }
};

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export const chatWithAI = async (
  history: ChatMessage[],
  newMessage: string,
  context?: { projectName?: string; templateName?: string; provider?: string }
): Promise<string> => {
  const modelId = "gemini-3-pro-preview";
  
  const systemInstruction = `
    You are Chkmate AI, an expert Cloud Infrastructure Assistant.
    You help users design, debug, and optimize their cloud infrastructure.
    
    Context:
    ${context?.projectName ? `Project: ${context.projectName}` : ''}
    ${context?.templateName ? `Blueprint: ${context.templateName}` : ''}
    ${context?.provider ? `Provider: ${context.provider}` : ''}
    
    Guidelines:
    - Be concise and technical.
    - Provide Terraform/IaC snippets when relevant.
    - Focus on security and cost optimization.
    - If you don't know something, ask for clarification.
  `;

  try {
    const chatSession = await ai.models.generateContentStream({
        model: modelId,
        config: {
            systemInstruction,
        },
        contents: [
            ...history.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            })),
            {
                role: 'user',
                parts: [{ text: newMessage }]
            }
        ]
    });

    // For simplicity in this implementation, we wait for the full response. 
    // Ideally we would stream it.
    let fullResponse = "";
    for await (const chunk of chatSession) {
        fullResponse += chunk.text;
    }
    
    return fullResponse;

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to get response from AI assistant.");
  }
};