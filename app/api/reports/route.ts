import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await clientPromise;
    const db = client.db("picker");
    const collection = db.collection("reports");

    let doc;
    if (body.type === "services") {
      doc = {
        type: "services",
        services: body.services,
        submittedAt: body.submittedAt,
        createdAt: new Date(),
      };
    } else {
      const { ratings, submittedAt, totalImages, reviewedCount } = body;
      doc = {
        type: "review",
        ratings,
        submittedAt,
        totalImages,
        reviewedCount,
        createdAt: new Date(),
      };
    }

    const result = await collection.insertOne(doc);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("picker");
    const collection = db.collection("reports");

    const reports = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
