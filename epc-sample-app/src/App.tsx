import { BrowserRouter, Routes, Route } from "react-router-dom";
import SampleApp from "./SampleApp";
import DetailsView from "./DetailsView"; // Import your new separate component


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point handling Encompass context checks */}
        <Route path="/" element={<SampleApp />} />

        {/* Redirect targets */}
        <Route path="/order" element={<DetailsView />} />
        <Route path="/details/:transactionId" element={<DetailsView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
