import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const NEON_API_BASE = "https://console.neon.tech/api/v2";

interface NeonProvisionRequest {
  projectId: string;
  branchName?: string;
  databaseName?: string;
}

interface NeonBranch {
  id: string;
  name: string;
  project_id: string;
  parent_id?: string;
  current_state: string;
  primary?: boolean;
  endpoints?: Array<{
    id: string;
    host: string;
    pooler_host?: string;
  }>;
  databases?: Array<{
    name: string;
    owner_name: string;
  }>;
  connection_uris?: Array<{
    connection_uri: string;
    connection_parameters: {
      database: string;
      password: string;
      role: string;
      host: string;
      pooler_host?: string;
    };
  }>;
}

async function neonFetch(path: string, apiKey: string, options?: RequestInit) {
  const res = await fetch(`${NEON_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...options?.headers,
    },
  });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = process.env.NEON_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEON_API_KEY not configured. Add it to Vercel environment variables." },
        { status: 500 }
      );
    }

    const body: NeonProvisionRequest = await req.json();
    const { projectId, branchName, databaseName = "neondb" } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // 1. Get the default branch to use as parent
    const branchesRes = await neonFetch(`/projects/${projectId}/branches`, apiKey);
    if (!branchesRes.ok) {
      const err = await branchesRes.json();
      return NextResponse.json(
        { error: `Failed to list branches: ${err.message || branchesRes.statusText}` },
        { status: branchesRes.status }
      );
    }

    const branchesData = await branchesRes.json();
    const defaultBranch = branchesData.branches?.find(
      (b: NeonBranch) => b.primary || b.name === "main" || b.name === "production"
    );

    if (!defaultBranch) {
      return NextResponse.json(
        { error: "No default branch found" },
        { status: 404 }
      );
    }

    // 2. Create a new branch from the default branch
    const createBranchBody: Record<string, unknown> = {
      endpoints: [{ type: "read_write" }],
      branch: {
        parent_id: defaultBranch.id,
        name: branchName || `tenant-${Date.now()}`,
      },
    };

    const createBranchRes = await neonFetch(
      `/projects/${projectId}/branches`,
      apiKey,
      { method: "POST", body: JSON.stringify(createBranchBody) }
    );

    if (!createBranchRes.ok) {
      const err = await createBranchRes.json();
      return NextResponse.json(
        { error: `Failed to create branch: ${err.message || createBranchRes.statusText}` },
        { status: createBranchRes.status }
      );
    }

    const branchData = await createBranchRes.json();
    const newBranch: NeonBranch = branchData.branch;

    // 3. Wait for branch to be ready (poll status)
    let attempts = 0;
    while (newBranch.current_state !== "ready" && attempts < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      const statusRes = await neonFetch(
        `/projects/${projectId}/branches/${newBranch.id}`,
        apiKey
      );
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        newBranch.current_state = statusData.branch.current_state;
        if (statusData.branch.endpoints) {
          newBranch.endpoints = statusData.branch.endpoints;
        }
      }
      attempts++;
    }

    // 4. Get connection details
    const connRes = await neonFetch(
      `/projects/${projectId}/connection_uri?branch_id=${newBranch.id}&database_name=${databaseName}&role_name=neondb_owner`,
      apiKey
    );

    let connectionUri = "";
    let pooledUri = "";
    if (connRes.ok) {
      const connData = await connRes.json();
      connectionUri = connData.uri || "";
    }

    // Build pooled URI from endpoint info
    const endpoint = newBranch.endpoints?.[0];
    if (endpoint) {
      pooledUri = connectionUri.replace(
        /@[^/]+/,
        `@${endpoint.pooler_host || endpoint.id + "-pooler"}`
      );
    }

    return NextResponse.json({
      success: true,
      branch: {
        id: newBranch.id,
        name: newBranch.name,
        state: newBranch.current_state,
      },
      connection: {
        direct: connectionUri,
        pooled: pooledUri || connectionUri,
        database: databaseName,
      },
    });
  } catch (error) {
    console.error("[neon/provision]", error);
    return NextResponse.json(
      { error: "Provisioning failed" },
      { status: 500 }
    );
  }
}

// GET: List existing branches for a project
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = process.env.NEON_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NEON_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId query parameter is required" },
        { status: 400 }
      );
    }

    const branchesRes = await neonFetch(`/projects/${projectId}/branches`, apiKey);
    if (!branchesRes.ok) {
      const err = await branchesRes.json();
      return NextResponse.json(
        { error: `Failed to list branches: ${err.message || branchesRes.statusText}` },
        { status: branchesRes.status }
      );
    }

    const data = await branchesRes.json();
    return NextResponse.json({
      branches: data.branches?.map((b: NeonBranch) => ({
        id: b.id,
        name: b.name,
        state: b.current_state,
        primary: b.primary,
      })) || [],
    });
  } catch (error) {
    console.error("[neon/provision GET]", error);
    return NextResponse.json(
      { error: "Failed to list branches" },
      { status: 500 }
    );
  }
}
