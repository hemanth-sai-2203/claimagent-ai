import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def create_claim_pdf(filename, doctor_name, reg_no, diagnosis, meds, tests, fee, med_cost, test_cost):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, f"Apollo Hospitals - Dr. {doctor_name}")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"Reg No: {reg_no}")
    c.drawString(50, height - 85, "123 Healthcare Avenue, Bangalore")
    c.line(50, height - 95, width - 50, height - 95)
    
    # Patient Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "PRESCRIPTION & BILL")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 145, "Patient: Test Member")
    c.drawString(300, height - 145, "Date: 01/11/2024")
    
    # Diagnosis & Rx
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 180, f"Diagnosis: {diagnosis}")
    c.drawString(50, height - 200, "Medicines Prescribed:")
    c.setFont("Helvetica", 11)
    y = height - 220
    for m in meds:
        c.drawString(70, y, f"- {m}")
        y -= 20
        
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, y - 10, "Tests Prescribed:")
    c.setFont("Helvetica", 11)
    y -= 30
    for t in tests:
        c.drawString(70, y, f"- {t}")
        y -= 20
        
    c.line(50, y - 20, width - 50, y - 20)
    
    # Bill Section
    y -= 50
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "BILL DETAILS")
    c.setFont("Helvetica", 11)
    y -= 30
    c.drawString(50, y, "Consultation Fee:")
    c.drawString(400, y, f"Rs. {fee}")
    y -= 20
    c.drawString(50, y, "Medicines Cost:")
    c.drawString(400, y, f"Rs. {med_cost}")
    y -= 20
    c.drawString(50, y, "Diagnostic Tests:")
    c.drawString(400, y, f"Rs. {test_cost}")
    
    y -= 20
    c.line(50, y, width - 50, y)
    y -= 20
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "TOTAL AMOUNT:")
    c.drawString(400, y, f"Rs. {fee + med_cost + test_cost}")
    
    # Footer Signature
    c.setFont("Helvetica", 10)
    c.drawString(400, 100, "_________________________")
    c.drawString(400, 85, f"Dr. {doctor_name} Signature")
    
    c.save()

os.makedirs("sample_documents", exist_ok=True)

# Generate TC001 Simple Consultation
create_claim_pdf(
    "sample_documents/TC001_Viral_Fever.pdf", 
    doctor_name="Rahul Verma", 
    reg_no="KA/12345/2015", 
    diagnosis="Viral Fever", 
    meds=["Paracetamol 500mg (1-1-1) 5 days", "Vitamin C (1-0-0) 5 days"],
    tests=["Complete Blood Count (CBC)"],
    fee=500, med_cost=250, test_cost=600
)

# Generate TC002 Dental
create_claim_pdf(
    "sample_documents/TC002_Dental.pdf", 
    doctor_name="Sneha Patil", 
    reg_no="MH/67890/2018", 
    diagnosis="Dental Cavity & Discoloration", 
    meds=["Amoxicillin 500mg", "Ibuprofen 400mg"],
    tests=["Dental X-Ray"],
    fee=800, med_cost=300, test_cost=400
) # Note: Doesn't have the teeth whitening separate in this simplistic view, but UI will pass 1500 + 4000

# Generate TC008 Fraud Check (Same details to reuse)
create_claim_pdf(
    "sample_documents/TC008_Fraud_Review.pdf", 
    doctor_name="A. Kumar", 
    reg_no="DL/34567/2020", 
    diagnosis="Gastroenteritis", 
    meds=["Ondansetron 4mg", "ORS Sachets"],
    tests=["Stool Routine"],
    fee=600, med_cost=150, test_cost=300
)

print("Sample PDFs generated successfully in 'sample_documents' folder!")
