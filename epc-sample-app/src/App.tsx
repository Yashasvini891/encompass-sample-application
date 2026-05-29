import { BrowserRouter, Routes, Route } from "react-router-dom";
import SampleApp from "./SampleApp";

// 1. Create your Order view component layout
const OrderView = () => (
  <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
    <h2>🛒 New Order Creation Page</h2>
    <p>
      No existing transaction context was detected. Ready to create a new
      record.
    </p>
  </div>
);

// 2. Create your Details view component layout
const DetailsView = () => (
  <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
    <h2>📄 Existing Transaction Details Page</h2>
    <p>
      Successfully caught your transaction context and auto-routed inside
      Encompass.
    </p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The root landing path "/" launches your SampleApp component */}
        <Route path="/" element={<SampleApp />} />

        {/* The target paths your EncompassMode component routes towards */}
        <Route path="/order" element={<OrderView />} />
        <Route path="/details/:transactionId" element={<DetailsView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
