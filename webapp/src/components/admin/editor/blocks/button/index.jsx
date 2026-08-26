import React from "react";
import { Button as _Button } from "@puckeditor/core";

const Button = {
  label: "Button",
  fields: {
    label: {
      type: "text",
      placeholder: "Lorem ipsum...",
      contentEditable: true,
    },
    href: { type: "text" },
    variant: {
      type: "radio",
      options: [
        { label: "primary", value: "primary" },
        { label: "secondary", value: "secondary" },
      ],
    },
  },
  defaultProps: {
    label: "Button",
    href: "#",
    variant: "primary",
  },
  render: ({ href, variant, label, puck }) => {
    const handleClick = () => {
      if (!puck.isEditing && href && href !== "#") {
        window.open(href, "_blank"); // Para abrir o link em uma nova aba
      }
    };

    return (
      <div>
        <_Button onClick={handleClick} variant={variant} size="large" tabIndex={puck.isEditing ? -1 : undefined}>
          {label}
        </_Button>
      </div>
    );
  },
};

export default Button;
