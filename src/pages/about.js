import React from "react";
import { Outlet } from "react-router-dom";

const About = () => {
  return (
    <>
      <div>about page </div>
      <Outlet />
    </>
  );
};

export default About;
