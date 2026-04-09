export const dynamic = "force-dynamic";

import { db } from "@/lib/prisma";
import { getLoggedInUser } from "@/lib/loggedin-user";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get("id");
    const courseId = searchParams.get("courseId");

    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find certificate
    let certificate;
    if (certificateId) {
      certificate = await db.certificate.findUnique({
        where: { id: certificateId },
        include: {
          course: {
            include: {
              user: true, // instructor
            },
          },
          user: true,
        },
      });
    } else if (courseId) {
      certificate = await db.certificate.findFirst({
        where: { userId: user.id, courseId },
        include: {
          course: {
            include: {
              user: true,
            },
          },
          user: true,
        },
      });
    }

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    // Only the certificate owner can view it
    if (certificate.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentName = certificate.user.name;
    const courseName = certificate.course.title;
    const instructorName = certificate.course.user?.name || "JustLearn Team";
    const dateStr = new Date(certificate.createdAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    const certId = certificate.id.slice(-8).toUpperCase();

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Completion – ${courseName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #f3f0ff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #7c3aed;
      color: white;
    }
    .btn-primary:hover { background: #6d28d9; }

    .btn-secondary {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-secondary:hover { background: #f9fafb; }

    /* Certificate */
    .certificate-wrapper {
      width: 100%;
      max-width: 960px;
      aspect-ratio: 1.414 / 1; /* A4 landscape */
      position: relative;
    }

    .certificate {
      width: 100%;
      height: 100%;
      background: #ffffff;
      position: relative;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0,0,0,0.18);
    }

    /* Decorative corner bg blobs */
    .cert-blob-tl {
      position: absolute; top: -60px; left: -60px;
      width: 220px; height: 220px;
      background: radial-gradient(circle, #ede9fe 0%, transparent 70%);
      pointer-events: none;
    }
    .cert-blob-br {
      position: absolute; bottom: -60px; right: -60px;
      width: 220px; height: 220px;
      background: radial-gradient(circle, #ddd6fe 0%, transparent 70%);
      pointer-events: none;
    }

    /* Outer border */
    .cert-border-outer {
      position: absolute;
      inset: 18px;
      border: 3px solid #7c3aed;
    }
    .cert-border-inner {
      position: absolute;
      inset: 26px;
      border: 1px solid #c4b5fd;
    }

    /* Seal badge top center */
    .cert-seal {
      position: absolute;
      top: 38px;
      left: 50%;
      transform: translateX(-50%);
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    }
    .cert-seal svg { width: 36px; height: 36px; color: white; }

    /* Content */
    .cert-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 80px 50px;
      text-align: center;
    }

    .cert-org {
      font-family: 'Playfair Display', serif;
      font-size: clamp(18px, 2.5vw, 26px);
      color: #7c3aed;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .cert-title {
      font-size: clamp(10px, 1.2vw, 13px);
      color: #9ca3af;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .cert-divider {
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      border-radius: 2px;
      margin-bottom: 20px;
    }

    .cert-presented {
      font-size: clamp(10px, 1vw, 12px);
      color: #9ca3af;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .cert-name {
      font-family: 'Playfair Display', serif;
      font-size: clamp(24px, 3.5vw, 40px);
      color: #1e1b4b;
      margin-bottom: 16px;
      letter-spacing: 1px;
    }

    .cert-body {
      font-size: clamp(11px, 1.1vw, 13px);
      color: #6b7280;
      line-height: 1.7;
      margin-bottom: 4px;
    }

    .cert-course {
      font-family: 'Playfair Display', serif;
      font-size: clamp(16px, 2vw, 22px);
      color: #7c3aed;
      font-weight: 700;
      margin-bottom: 24px;
      max-width: 70%;
      line-height: 1.3;
    }

    .cert-footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding-top: 18px;
      border-top: 1px solid #e5e7eb;
      margin-top: 4px;
    }

    .cert-footer-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex: 1;
    }

    .cert-sig-line {
      width: 110px;
      height: 1px;
      background: #9ca3af;
      margin-bottom: 4px;
    }

    .cert-footer-label {
      font-size: clamp(8px, 0.9vw, 10px);
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cert-footer-value {
      font-size: clamp(10px, 1.1vw, 13px);
      color: #374151;
      font-weight: 600;
    }

    /* Corner ornaments */
    .ornament {
      position: absolute;
      width: 40px;
      height: 40px;
      opacity: 0.15;
    }
    .ornament-tl { top: 36px; left: 36px; }
    .ornament-tr { top: 36px; right: 36px; transform: scaleX(-1); }
    .ornament-bl { bottom: 36px; left: 36px; transform: scaleY(-1); }
    .ornament-br { bottom: 36px; right: 36px; transform: scale(-1); }

    @media print {
      body {
        background: white;
        padding: 0;
      }
      .toolbar { display: none !important; }
      .certificate-wrapper {
        max-width: 100%;
        width: 100vw;
        height: 100vh;
        aspect-ratio: unset;
      }
      .certificate {
        box-shadow: none;
      }
      @page {
        size: A4 landscape;
        margin: 0;
      }
    }
  </style>
</head>
<body>

  <div class="toolbar">
    <button class="btn btn-primary" onclick="window.print()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
      Download / Print PDF
    </button>
    <a class="btn btn-secondary" href="/account/certificates">
      ← Back to Certificates
    </a>
  </div>

  <div class="certificate-wrapper">
    <div class="certificate">
      <!-- bg blobs -->
      <div class="cert-blob-tl"></div>
      <div class="cert-blob-br"></div>

      <!-- borders -->
      <div class="cert-border-outer"></div>
      <div class="cert-border-inner"></div>

      <!-- Corner ornaments (SVG star/fleur) -->
      <svg class="ornament ornament-tl" viewBox="0 0 40 40" fill="#7c3aed" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0 L22 14 L36 8 L28 20 L40 24 L26 24 L30 38 L20 28 L10 38 L14 24 L0 24 L12 20 L4 8 L18 14 Z"/>
      </svg>
      <svg class="ornament ornament-tr" viewBox="0 0 40 40" fill="#7c3aed" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0 L22 14 L36 8 L28 20 L40 24 L26 24 L30 38 L20 28 L10 38 L14 24 L0 24 L12 20 L4 8 L18 14 Z"/>
      </svg>
      <svg class="ornament ornament-bl" viewBox="0 0 40 40" fill="#7c3aed" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0 L22 14 L36 8 L28 20 L40 24 L26 24 L30 38 L20 28 L10 38 L14 24 L0 24 L12 20 L4 8 L18 14 Z"/>
      </svg>
      <svg class="ornament ornament-br" viewBox="0 0 40 40" fill="#7c3aed" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0 L22 14 L36 8 L28 20 L40 24 L26 24 L30 38 L20 28 L10 38 L14 24 L0 24 L12 20 L4 8 L18 14 Z"/>
      </svg>

      <!-- Seal -->
      <div class="cert-seal">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      </div>

      <!-- Main content -->
      <div class="cert-content">
        <div class="cert-org">JustLearn</div>
        <div class="cert-title">Certificate of Completion</div>
        <div class="cert-divider"></div>

        <div class="cert-presented">This certificate is proudly presented to</div>
        <div class="cert-name">${studentName}</div>

        <div class="cert-body">for successfully completing the course</div>
        <div class="cert-course">${courseName}</div>

        <div class="cert-footer">
          <div class="cert-footer-col">
            <div class="cert-sig-line"></div>
            <div class="cert-footer-value">${instructorName}</div>
            <div class="cert-footer-label">Instructor</div>
          </div>
          <div class="cert-footer-col">
            <div class="cert-footer-value" style="font-size:clamp(9px,0.9vw,11px);color:#9ca3af;letter-spacing:1px;text-transform:uppercase;margin-bottom:2px;">Certificate ID</div>
            <div class="cert-footer-value" style="font-family:monospace;font-size:clamp(11px,1.1vw,13px);color:#7c3aed;">${certId}</div>
          </div>
          <div class="cert-footer-col">
            <div class="cert-sig-line"></div>
            <div class="cert-footer-value">${dateStr}</div>
            <div class="cert-footer-label">Date of Completion</div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    );
  }
}
