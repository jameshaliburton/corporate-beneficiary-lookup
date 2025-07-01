
async function testVision() {
  const response = await fetch("http://localhost:3000/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: "data:image/jpeg;base64,testimage",
      test_mode: true
    })
  });
  const result = await response.json();
  console.log("Status:", response.status);
  console.log("Success:", result.success);
  console.log("Result Type:", result.result_type);
  console.log("Financial Beneficiary:", result.financial_beneficiary);
}
testVision();

