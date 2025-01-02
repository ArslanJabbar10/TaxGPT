import "./App.css";
import FirstPage from "./components/FirstPage";
import SecondPage from "./components/SecondPage";

import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    element: <FirstPage />,
  },
  {
    path: "/chat/:hashId",
    element: <SecondPage />,
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
