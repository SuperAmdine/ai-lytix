export const PageContainer = ({ children }: React.ComponentProps<"div">) => {
  return (
    <main className="fixed bottom-2 left-2 right-2 top-13 ">
      <div className="absolute top-0 left-0 peer-[button]:left-11 right-0 bottom-0 bg-white rounded-2xl border-gray-200 border flex flex-col peer-[.is-chat-open]:left-64 duration-300">
        {children}
      </div>
    </main>
  );
};

export const PageContainerHeader = ({
  children,
}: React.ComponentProps<"div">) => {
  return (
    <div className="w-full p-2 border-b  flex items-center gap-3 border-b-gray-50">
      {children}
    </div>
  );
};
export const PageContainerHeaderTitle = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="ml-3 font-sm font-medium">{children}</div>;
};
export const PageContainerHeaderMoreActions = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="ml-auto flex gap-2">{children}</div>;
};
export const PageContainerContent = ({
  children,
}: React.ComponentProps<"div">) => {
  return <div className="flex-1 overflow-scroll p-5">{children}</div>;
};
