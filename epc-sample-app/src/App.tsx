import { BrowserRouter, Routes, Route } from "react-router-dom";
import SampleApp from "./SampleApp";
import DetailsView from "./DetailsView"; // Import your new separate component

// Inline placeholder for Order View
const OrderView = () => (
  <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
    <h2>🛒 New Order Creation Page</h2>
    <p>
      Please populate the details to dispatch a new product token workflow
      request.
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry point handling Encompass context checks */}
        <Route path="/" element={<SampleApp />} />

        {/* Redirect targets */}
        <Route path="/order" element={<OrderView />} />
        <Route path="/details/:transactionId" element={<DetailsView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
