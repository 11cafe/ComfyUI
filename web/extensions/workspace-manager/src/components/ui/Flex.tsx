import React, { forwardRef } from "react";

const Flex = forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  (props, ref) => {
    return (
      <div
        ref={ref}
        style={{ display: "flex", flexDirection: "row", ...props.style }}
        {...props}
      />
    );
  },
);

export default Flex;
