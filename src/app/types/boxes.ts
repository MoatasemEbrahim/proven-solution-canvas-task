export type ClassName = "Name" | "Date" | "Number" | "Amount" | "Supplier" | "Description";

export type Box = {
  _id: string;
  class: ClassName;
  points: [number, number, number, number];
  text: string;
};
