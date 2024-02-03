export type ClassName = "Name" | "Date" | "Number" | "Amount" | "Supplier" | "Description";

export type Box = {
  class: ClassName;
  points: [number, number, number, number];
  text: string;
};
