import React, { useState, useEffect } from "react";

import io from "socket.io-client";

export const Context = React.createContext({});

const socket = io("http://localhost:8000");

export const ContextProvider = ({ children }) => {
  //Voting panel states
  const [c_roomId, c_setRoomId] = useState("");

  const [c_nickname, c_setNickname] = useState("");
  const [c_wordsAndCategories, c_setWordsAndCategories] = useState(null);

  
  return (
    <Context.Provider
      value={{
        c_wordsAndCategories,
        c_setWordsAndCategories,
        c_socket: socket,
        c_nickname,
        c_setNickname,
        c_roomId,
        c_setRoomId,
      }}
    >
      {children}
    </Context.Provider>
  );
};
