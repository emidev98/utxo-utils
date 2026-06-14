import { render } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

describe("renders without crashing", () => {
  const { baseElement } = render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  );

  it("renders the app component", () => {
    expect(baseElement).toBeTruthy();
  });
});
