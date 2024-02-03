"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import data from "@/task-object.json";
import debounce from "lodash.debounce";

import { Box, ClassName } from "@/app/types/boxes";
import { classes } from "@/app/utils/boxesCanvasHelpers";

export default function Home() {
  const [boxes] = useState<Box[]>(data.boxes as Box[]);
  const [groupedBoxes, setGroupedBoxes] = useState<
    Record<ClassName, Box[]> | Record<string, never>
  >({});
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<{
    width: number;
    height: number;
    horizontalRenderRatio: number;
    verticalRenderRatio: number;
  }>({ width: 0, height: 0, horizontalRenderRatio: 0, verticalRenderRatio: 0 });

  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const boxesCanvasRef = useRef<HTMLCanvasElement>(null);

  const calculateCanvasSize = useMemo(
    () =>
      debounce((renderedImage: HTMLImageElement | null) => {
        if (!renderedImage) return;

        const isMobile = window.innerWidth < 640;

        let width = window.innerWidth - 250;
        if (isMobile) {
          width = window.innerWidth;
        }
        const height = (width / renderedImage.width) * renderedImage.height;

        const horizontalRenderRatio = width / (renderedImage.width || 1);
        const verticalRenderRatio = height / (renderedImage.height || 1);

        setCanvasDimensions({
          width,
          height,
          horizontalRenderRatio,
          verticalRenderRatio,
        });
      }, 100),
    []
  );

  // calculate canvases dimentiones for the first time only after image is loaded successfully
  useEffect(() => {
    if (image) {
      calculateCanvasSize(image);
    }
  }, [image]);

  // re-calculate canvases dimentiones on resizing the screen
  useEffect(() => {
    const img = new Image();
    img.src = data.base64;
    img.onload = () => {
      setImage(img);
    };

    const resizeHandler = () => {
      calculateCanvasSize(img);
    };
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, []);

  // draw background image in backgroundCanvas
  useEffect(() => {
    if (image) {
      const backgroundCanvas = backgroundCanvasRef.current;
      if (backgroundCanvas) {
        const backgroundCtx = backgroundCanvas.getContext("2d");
        if (backgroundCtx) {
          backgroundCanvas.width = canvasDimensions.width;
          backgroundCanvas.height = canvasDimensions.height;
          backgroundCtx.drawImage(image, 0, 0, canvasDimensions.width, canvasDimensions.height);
        }
      }
    }
  }, [canvasDimensions]);

  // draw boxes in boxesCanvas
  useEffect(() => {
    const boxesCanvas = boxesCanvasRef.current;
    if (boxesCanvas && canvasDimensions.width > 0) {
      boxesCanvas.width = canvasDimensions.width;
      boxesCanvas.height = canvasDimensions.height;
      const boxesCtx = boxesCanvas.getContext("2d");
      if (boxesCtx) {
        boxes.forEach((box) => {
          const {
            text,
            points: [x1, y1, x2, y2],
          } = box;
          const width = x2 - x1;
          const height = y2 - y1;

          boxesCtx.fillStyle = classes[box.class];
          const { horizontalRenderRatio, verticalRenderRatio } = canvasDimensions;
          boxesCtx.fillRect(
            x1 * horizontalRenderRatio,
            y1 * verticalRenderRatio,
            width * horizontalRenderRatio,
            height * verticalRenderRatio
          );

          const textX = (x1 + 10) * horizontalRenderRatio;
          const textY = (y1 + height / 1.25) * verticalRenderRatio;
          boxesCtx.font = `${Math.max(14 * horizontalRenderRatio, 6)}px Arial`;
          boxesCtx.fillStyle = "white";
          boxesCtx.fillText(text, textX, textY, width - 10);
        });
      }
    }
  }, [boxes, canvasDimensions]);

  useEffect(() => {
    const groups = boxes.reduce((acc, box) => {
      if (Object.hasOwn(acc, box.class)) {
        return { ...acc, [box.class]: [...acc[box.class], box] };
      } else {
        return { ...acc, [box.class]: [box] };
      }
    }, {});
    setGroupedBoxes(groups);
  }, [boxes]);

  return (
    <>
      <div className="hidden sm:block h-screen absolute p-4">
        {Object.entries(groupedBoxes).map(([className, boxes]) => (
          <React.Fragment key={className}>
            <h3 className="text-xl" style={{ color: classes[className as ClassName] }}>
              {className}
            </h3>
            {boxes.map((box, i) => (
              <button
                className="m-2 border-2 block p-1"
                key={`${className}-${box.text}-${i}`}
                onClick={() => {}}
              >
                {box.text}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
      <canvas ref={backgroundCanvasRef} className="absolute left-0 sm:left-[250px]">
        Canvas is not supported
      </canvas>
      <canvas ref={boxesCanvasRef} className="absolute z-10 left-0 sm:left-[250px]">
        Canvas is not supported
      </canvas>
    </>
  );
}
