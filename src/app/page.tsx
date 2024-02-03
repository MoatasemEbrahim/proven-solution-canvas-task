"use client";

import React, { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import data from "@/task-object.json";
import debounce from "lodash.debounce";

import { Dialog, DialogContent } from "@/app/components/Dialog";
import { Box, ClassName } from "@/app/types/boxes";
import { classes } from "@/app/utils/boxesCanvasHelpers";

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>(data.boxes as Box[]);
  const [activeBox, setActiveBox] = useState<Box | null>(null);
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
      // debounce is used to handle the many func calls on resizing the window
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

  // listen for click events on the canvas and deteced selected box
  useEffect(() => {
    const boxesCanvas = boxesCanvasRef.current;
    if (!boxesCanvas) return;
    const handleBoxSelection = (e: MouseEvent) => {
      const mouseX = e.offsetX;
      const mouseY = e.offsetY;
      const selectedBox = boxes.find(
        (box) =>
          box.points[0] * canvasDimensions.horizontalRenderRatio <= mouseX &&
          box.points[1] * canvasDimensions.verticalRenderRatio <= mouseY &&
          box.points[2] * canvasDimensions.horizontalRenderRatio >= mouseX &&
          box.points[3] * canvasDimensions.verticalRenderRatio >= mouseY
      );
      setActiveBox(selectedBox ?? null);
    };
    boxesCanvas.addEventListener("click", handleBoxSelection);

    return () => {
      boxesCanvas.removeEventListener("click", handleBoxSelection);
    };
  }, [boxes, canvasDimensions]);

  // group boxes by class to display them in the sidebar
  useEffect(() => {
    const groups = boxes.reduce(
      (acc, box) => {
        if (Object.hasOwn(acc, box.class)) {
          return { ...acc, [box.class]: [...acc[box.class], box] };
        } else {
          return { ...acc, [box.class]: [box] };
        }
      },
      {} as Record<ClassName, Box[]>
    );
    setGroupedBoxes(groups);
  }, [boxes]);

  const handleSidebarItemClick = (box: Box) => () => {
    setActiveBox(box);
  };

  const handleTextInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!activeBox) return;
    setActiveBox({ ...activeBox, text: e.target.value });
  };

  const handleClassInputChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (!activeBox) return;
    setActiveBox({ ...activeBox, class: e.target.value as ClassName });
  };

  const handleUpdateBox = () => {
    const newBoxes = boxes.map((box) => (box._id === activeBox?._id ? activeBox : box));
    setBoxes(newBoxes);
    setActiveBox(null);
  };

  const handleDeleteBox = () => {
    const newBoxes = boxes.filter((box) => box._id !== activeBox?._id);
    setBoxes(newBoxes);
    setActiveBox(null);
  };

  const handleCancelEditing = () => {
    setActiveBox(null);
  };

  return (
    <>
      <canvas ref={backgroundCanvasRef} className="absolute left-0 sm:left-[250px]">
        Canvas is not supported
      </canvas>
      <canvas ref={boxesCanvasRef} className="absolute z-10 left-0 sm:left-[250px]">
        Canvas is not supported
      </canvas>

      {/* Sidebar */}
      <div className="hidden sm:block h-screen absolute p-4">
        {Object.entries(groupedBoxes).map(([className, boxes]) => (
          <React.Fragment key={className}>
            <h3 className="text-xl" style={{ color: classes[className as ClassName] }}>
              {className}
            </h3>
            {boxes.map((box) => (
              <button
                className="m-2 border-2 block p-1"
                key={box._id}
                onClick={handleSidebarItemClick(box)}
              >
                {box.text}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Dialog for editing box */}
      {activeBox && (
        <Dialog
          open={!!activeBox}
          onOpenChange={() => {
            setActiveBox(null);
          }}
        >
          <DialogContent>
            <div className="flex max-h-[80vh] flex-col">
              <span className="text-base font-medium dark:text-black ltr:text-left rtl:text-right mb-2">
                Edit box
              </span>
              <div className="flex items-center gap-2 my-3">
                <p>Text:</p>
                <input
                  className="border rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
                  type="text"
                  value={activeBox.text}
                  onChange={handleTextInputChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <p>Class:</p>
                <select
                  className="border rounded-md px-4 py-2 focus:outline-none focus:border-blue-500"
                  onChange={handleClassInputChange}
                  value={activeBox.class}
                >
                  {Object.keys(classes).map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-2 py-4 flex justify-between flex-wrap">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleUpdateBox}
                >
                  Update Box
                </button>
                <button
                  className="bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleDeleteBox}
                >
                  Delete box
                </button>
                <button
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleCancelEditing}
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
