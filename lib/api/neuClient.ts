/**
 * HTTP client for the Neu AI code generation API
 * 
 * This client communicates with the neu server (http://localhost:8080)
 * to perform AI-powered code operations.
 */

const NEU_BASE_URL = 'http://localhost:8080';

export interface GenerateCodeRequest {
  prompt: string;
}

export interface GenerateCodeResponse {
  result: string;
  error?: string;
}

export interface ExplainCodeRequest {
  code: string;
}

export interface ExplainCodeResponse {
  result: string;
  error?: string;
}

export interface ReviewCodeRequest {
  code: string;
}

export interface ReviewCodeResponse {
  result: string;
  error?: string;
}

export interface CreateFileRequest {
  path: string;
  content: string;
}

export interface CreateFileResponse {
  result: string;
  error?: string;
}

export interface EditFileRequest {
  path: string;
  oldCode: string;
  newCode: string;
}

export interface EditFileResponse {
  result: string;
  error?: string;
}

/**
 * Generate code from a prompt using the neu API
 */
export async function generateCode(prompt: string): Promise<string> {
  const response = await fetch(`${NEU_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: GenerateCodeResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

/**
 * Explain how code works using the neu API
 */
export async function explainCode(code: string): Promise<string> {
  const response = await fetch(`${NEU_BASE_URL}/api/v1/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: ExplainCodeResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

/**
 * Review code for improvements using the neu API
 */
export async function reviewCode(code: string): Promise<string> {
  const response = await fetch(`${NEU_BASE_URL}/api/v1/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: ReviewCodeResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

/**
 * Create a file with generated content
 */
export async function createFile(path: string, content: string): Promise<string> {
  const response = await fetch(`${NEU_BASE_URL}/api/v1/create-file`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, content }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: CreateFileResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

/**
 * Edit a file by replacing old code with new code
 */
export async function editFile(path: string, oldCode: string, newCode: string): Promise<string> {
  const response = await fetch(`${NEU_BASE_URL}/api/v1/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path, oldCode, newCode }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: EditFileResponse = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

/**
 * Check if neu server is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${NEU_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
