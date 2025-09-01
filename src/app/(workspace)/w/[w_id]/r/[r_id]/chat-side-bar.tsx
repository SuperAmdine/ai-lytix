"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  IconLayoutSidebarRightExpand,
  IconBrandHipchat,
  IconSend,
} from "@tabler/icons-react";
import { useState } from "react";

export default function ChatSidebar() {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <aside
        className={cn(
          "absolute peer is-chat left-0 right-0 bottom-0 top-0  z-40 flex flex-col pr-2 py-12   duration-300 transition",
          isOpen ? "is-chat-open  w-64" : "w-64 -translate-x-64"
        )}
      >
        <div className="flex-1 overflow-scroll bg-white border-x border-t p-3 rounded-t-xl">
          <div className="p-1 bg-gray-200/0 antialiased">
            Let's print some charts ! <br />
            Just type in what you want, and i'll help you get the data you need.
          </div>
        </div>

        <div className="mx-auto space-y-4 w-full border-x border-b bg-white p-1 rounded-b-xl">
          {/* Input */}
          <div className="relative">
            {/* <textarea
              className="p-3 sm:p-4 pb-12 sm:pb-12 block w-full bg-gray-100 border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ask me anything..."
            ></textarea> */}
            <Textarea
              className="resize-none sm:pb-10 bg-gray-100 border-gray-200 rounded-xl"
              placeholder="example:facebook impression for the last week,or generate performance charts for @my-campaign for the last week"
            />
            {/* Toolbar */}
            <div className="absolute bottom-px inset-x-px p-1 rounded-b-lg  ">
              <div className="flex flex-wrap justify-between items-center gap-2">
                {/* Button Group */}
                <div className="flex items-center"></div>
                {/* End Button Group */}

                {/* Button Group */}
                <div className="flex items-center gap-x-1">
                  <Button
                    variant="default"
                    size="icon"
                    className="size-8 rounded-2xl"
                  >
                    <IconSend />
                  </Button>
                  {/* Send Button */}
                  {/* <button
                    type="button"
                    className="inline-flex shrink-0 justify-center items-center size-8 rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:z-10 focus:outline-hidden focus:bg-blue-500"
                  >
                    <svg
                      className="shrink-0 size-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                    </svg>
                  </button> */}
                  {/* End Send Button */}
                </div>
                {/* End Button Group */}
              </div>
            </div>
            {/* End Toolbar */}
          </div>
          {/* End Input */}
        </div>
      </aside>
      <Button
        size="icon"
        className={cn(
          "size-9 absolute left-0 top-2 peer-[.is-chat-open]:left-53 z-100 duration-300 "
        )}
        variant="outline"
        onClick={(e) => {
          console.log("'lkjlk", e);
          setOpen(!isOpen);
        }}
      >
        <IconBrandHipchat
          className={cn("size-6 duration-300", isOpen && "rotate-90")}
          stroke={1.2}
        />
        {/* {isOpen ? (
          <IconLayoutSidebarRightExpand className="size-6" stroke={1.2} />
        ) : (
          <IconBrandHipchat className="size-6" stroke={1.2} />
        )} */}
      </Button>
    </>
  );
}
