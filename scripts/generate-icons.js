import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function drawRoundedRect(ctx, size, radius) {
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
}

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#58CC02";
  drawRoundedRect(ctx, size, size * 0.22);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${size * 0.55}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", size / 2, size / 2 + size * 0.03);

  writeFileSync(outputPath, canvas.toBuffer("image/png"));
  console.log(`Generado: ${outputPath}`);
}

generateIcon(192, "public/icon-192.png");
generateIcon(512, "public/icon-512.png");
