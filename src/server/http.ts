import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError, type ZodType } from "zod";
import { ApiError } from "@/lib/errors";
import { connectDB } from "@/server/db";

export type RouteContext = { params: Promise<Record<string, string>> };

const noStore = { "Cache-Control": "no-store" };

export function handle(
  handler: (request: Request, context: RouteContext) => Promise<unknown>,
) {
  return async (request: Request, context?: RouteContext) => {
    try {
      await connectDB();
      const data = await handler(request, context ?? { params: Promise.resolve({}) });
      return NextResponse.json({ success: true, data }, { headers: noStore });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: { message: error.message } },
      { status: error.status, headers: noStore },
    );
  }

  if (error instanceof ZodError) {
    const message = error.issues
      .slice(0, 4)
      .map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      })
      .join(" ");
    return NextResponse.json(
      { success: false, error: { message: message || "Invalid input" } },
      { status: 422, headers: noStore },
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid id" } },
      { status: 400, headers: noStore },
    );
  }

  if (typeof error === "object" && error && "code" in error && error.code === 11000) {
    return NextResponse.json(
      { success: false, error: { message: "That record already exists" } },
      { status: 409, headers: noStore },
    );
  }

  console.error(error);
  return NextResponse.json(
    { success: false, error: { message: "Something went wrong" } },
    { status: 500, headers: noStore },
  );
}

export async function readJson<T>(request: Request, schema: ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Invalid JSON body", 400);
  }
  return schema.parse(body);
}

export async function readParamId(context: RouteContext) {
  const params = await context.params;
  const id = params.id;
  if (!id || !/^[a-f\d]{24}$/i.test(id)) throw new ApiError("Invalid id", 400);
  return id;
}

export function readListQuery(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(url.searchParams.get("limit") || "12", 10) || 12),
  );
  const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
  return { url, page, limit, skip: (page - 1) * limit, q };
}

export function containsRegex(q: string) {
  if (!q) return null;
  return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
