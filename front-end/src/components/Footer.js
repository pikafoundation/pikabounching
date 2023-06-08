import React from "react";
import { AiOutlineTwitter, AiOutlineGithub } from "react-icons/ai";
import { RiDiscordFill } from "react-icons/ri";

function Footer() {
  return (
    <div className="footer container">
      <p>
        <i>RabbitBounching</i>&#169; All Right Reserved
      </p>
      <div className="social">
        <a target="_blank" href="https://github.com/floorpricelab">
          <AiOutlineGithub size={24} color="#000" />
        </a>
        <a target="_blank" href="https://twitter.com/rabbitbounching">
          <AiOutlineTwitter size={24} color="#000" />
        </a>
        <a target="_blank" href="https://discord.gg/rabbitbounching">
          <RiDiscordFill size={24} color="#000" />
        </a>
      </div>
    </div>
  );
}

export default Footer;
