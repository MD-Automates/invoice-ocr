🇲🇦 Moroccan E-Invoicing AI Pipeline (DGI / xHub)

A zero-touch n8n automation pipeline that converts messy, unstructured paper invoices into strict, government-compliant UBL 2.1 XML payloads for the Moroccan DGI (xHub) mandate.

Instead of relying on fragile OCR templates, this workflow uses AI for extraction and deterministic JavaScript for mathematical tax validation.

🧠 How It Works

AI Extraction: Uses Google Gemini (Vision) to extract vendor info, ICE, and line items from PDFs or smartphone photos.

Math & ICE Validation: A custom Node.js block mathematically verifies the Moroccan ICE (Modulo 97) and recalculates all TVA/TTC totals. If the AI hallucinates a number, the workflow halts.

XML Generation: Validated JSON is dynamically mapped into the exact OASIS UBL 2.1 XML dialect required by the DGI.

💻 How to Use

Download the xfacture_workflow.json file from this repository.

Open your n8n instance.

Go to the top right of your canvas, click Import from File, and select the JSON.

Add your free Gemini API key to the HTTP Request node to start processing documents!

Built by MD Automates.
