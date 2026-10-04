import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

from reportlab.lib.pagesizes import landscape, letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# ----------------------------------------------------
# Directory Setup
# ----------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DELIVERABLES_DIR = os.path.join(PROJECT_ROOT, "Deliverables")
SCREENSHOTS_DIR = os.path.join(PROJECT_ROOT, "screenshots")
os.makedirs(DELIVERABLES_DIR, exist_ok=True)

PPTX_PATH = os.path.join(DELIVERABLES_DIR, "26100587_Abhinesh_RevLensAI_Presentation.pptx")
PDF_PATH = os.path.join(DELIVERABLES_DIR, "26100587_Abhinesh_RevLensAI_Presentation.pdf")
PDF_ALIAS_PATH = os.path.join(DELIVERABLES_DIR, "RevLens_AI_Presentation.pdf")

# ----------------------------------------------------
# Presentation Data Model
# ----------------------------------------------------
SLIDES_DATA = [
    {
        "num": 1,
        "title": "RevLens AI — Review Intelligence & Analytics",
        "subtitle": "AI-Powered Homestay Review Management & Trust Analytics Platform",
        "type": "title",
        "details": [
            ("Project Title", "RevLens AI"),
            ("Intern Name", "Abhinesh (Abhinesh Gangwar)"),
            ("Intern ID", "TBI-26100587"),
            ("University", "Graphic Era Deemed To Be University"),
            ("GitHub", "https://github.com/strange-exe/revlens-ai"),
            ("Live App", "https://revlens.abhinesh.codes")
        ]
    },
    {
        "num": 2,
        "title": "What Problem Are We Solving?",
        "subtitle": "Challenges in Homestay & Hospitality Feedback Management",
        "type": "content",
        "bullets": [
            "<b>Fragmented Feedback Signals:</b> Homestay owners receive guest feedback across multiple channels without unified tracking.",
            "<b>Reputational Risk:</b> Unmoderated spam, link injections, or unaddressed negative reviews damage host ratings rapidly.",
            "<b>Operational Bottleneck:</b> Manually crafting personalized, tone-matched responses for every guest consumes hours daily.",
            "<b>Lack of Actionable Insights:</b> Hosts lack real-time analytics to spot recurring maintenance or service issues across properties."
        ]
    },
    {
        "num": 3,
        "title": "Tech Stack Selected & Rationale",
        "subtitle": "Modern, High-Performance Full-Stack Architecture",
        "type": "content",
        "bullets": [
            "<b>Frontend — React 18 (Vite) + Tailwind CSS:</b> Fast component rendering, dynamic dark mode tokens, and crisp responsive layout.",
            "<b>Backend — FastAPI (Python 3.12):</b> Asynchronous REST API execution, Pydantic type safety, and instant auto-generated OpenAPI documentation.",
            "<b>AI Model — Google Gemini API (gemini-1.5-flash):</b> Sub-second inference latency, high accuracy in sentiment scoring and contextual text generation.",
            "<b>Database — PostgreSQL (Supabase):</b> Relational integrity, ACID compliance, with local SQLite fallback engine for offline resilience."
        ]
    },
    {
        "num": 4,
        "title": "Frontend Overview & Live Application",
        "subtitle": "Responsive Interface & Real-time Analytics Dashboard",
        "type": "image_left",
        "image": os.path.join(SCREENSHOTS_DIR, "2_read.png"),
        "bullets": [
            "<b>Live Application URL:</b> <font color='#8B5CF6'><u>https://revlens.abhinesh.codes</u></font>",
            "<b>Real-time Metrics Dashboard:</b> Visual breakdown of average guest ratings, total reviews, and sentiment distribution.",
            "<b>Dynamic Search & Filtering:</b> Live keyword, property, and rating filters with instantaneous client-side updates.",
            "<b>User Experience:</b> Built with custom typography, dark theme tokens, modal dialogues, and responsive mobile ergonomics."
        ]
    },
    {
        "num": 5,
        "title": "Backend APIs & Testing Verification",
        "subtitle": "FastAPI REST API Architecture & Validation",
        "type": "image_right",
        "image": os.path.join(SCREENSHOTS_DIR, "1_login.png"),
        "bullets": [
            "<b>Interactive Swagger Docs:</b> <font color='#8B5CF6'><u>https://revlens-backend.onrender.com/docs</u></font>",
            "<b>API 1 — POST /api/ai/analyze-review:</b> Accepts review text, passes it to Gemini LLM to return sentiment (positive/neutral/negative), spam flags, and confidence scores.",
            "<b>API 2 — POST /api/auth/login & GET /api/reviews:</b> Authenticates host credentials with bcrypt password hashing, issues JWT bearer tokens, and executes SQLAlchemy filtered queries."
        ]
    },
    {
        "num": 6,
        "title": "Database Selected & Relational Schema",
        "subtitle": "PostgreSQL hosted on Supabase Cloud (with Local SQLite Fallback)",
        "type": "content",
        "bullets": [
            "<b>Database Selected:</b> PostgreSQL hosted on Supabase Cloud with connection pooling and SSL encryption.",
            "<b>Relational Schema Structure:</b>",
            "   • <b>User:</b> Stores host authentication, email, hashed_password, and created_at timestamps.",
            "   • <b>Property (1:N):</b> Relates homestay properties to owner User ID with title, location, and metadata.",
            "   • <b>Review (1:N):</b> Relates reviews to Property ID with rating (1-5), sentiment score, spam status, and author name.",
            "<b>Rationale:</b> Ensures strict foreign key integrity, fast relational joins, ACID compliance, and effortless cloud scaling."
        ]
    },
    {
        "num": 7,
        "title": "AI Feature & LLM Integration",
        "subtitle": "Google Gemini 1.5 Flash API + Local Heuristic Fallback",
        "type": "image_left",
        "image": os.path.join(SCREENSHOTS_DIR, "ai_reply_verification.png"),
        "bullets": [
            "<b>LLM Model Selected:</b> Google Gemini API (<code>gemini-1.5-flash</code>).",
            "<b>Use Case 1 — Sentiment Classification:</b> Analyzes guest review text and classifies sentiment into positive, neutral, or negative.",
            "<b>Use Case 2 — Abuse & Spam Audit:</b> Detects promotional links, malicious patterns, or abusive language.",
            "<b>Use Case 3 — AI Response Assistant:</b> Generates brand-aligned, empathetic host replies based on rating and tone parameters.",
            "<b>Uptime Guarantee:</b> Integrated local NLP heuristic engine ensures 100% service uptime even if API quotas freeze."
        ]
    },
    {
        "num": 8,
        "title": "Hosting Services & Cloud Deployment",
        "subtitle": "Production Multi-Cloud Infrastructure Strategy",
        "type": "content",
        "bullets": [
            "<b>Frontend Hosting — Vercel:</b> Deployed at <font color='#8B5CF6'><u>https://revlens.abhinesh.codes</u></font> with global CDN distribution and automatic GitHub CI/CD integration.",
            "<b>Backend Hosting — Render:</b> Managed FastAPI Python Web Service hosted at <font color='#8B5CF6'><u>https://revlens-backend.onrender.com/</u></font>.",
            "<b>Database Cloud — Supabase:</b> Managed PostgreSQL database instance with SSL security and connection pooling.",
            "<b>Domain & DNS:</b> Custom domain routed through Cloudflare DNS with full HTTPS SSL/TLS encryption."
        ]
    },
    {
        "num": 9,
        "title": "Public Live URLs & Access Links",
        "subtitle": "All Links Are Publicly Accessible Online",
        "type": "content",
        "bullets": [
            "<b>🌐 Live Frontend Application:</b> <font color='#8B5CF6'><u>https://revlens.abhinesh.codes</u></font>",
            "<b>⚙️ Live Backend REST API:</b> <font color='#8B5CF6'><u>https://revlens-backend.onrender.com/</u></font>",
            "<b>📖 Interactive API Docs (Swagger):</b> <font color='#8B5CF6'><u>https://revlens-backend.onrender.com/docs</u></font>",
            "<b>💻 GitHub Code Repository:</b> <font color='#8B5CF6'><u>https://github.com/strange-exe/revlens-ai</u></font>"
        ]
    },
    {
        "num": 10,
        "title": "Internship Reflection & Key Learnings",
        "subtitle": "Technical Mastery & Professional Growth Experience",
        "type": "content",
        "bullets": [
            "<b>Technical Skills Acquired:</b> Full-stack API architecture with FastAPI & React 18, LLM prompt engineering, production cloud deployments, and resilient database fallback design.",
            "<b>Software Resilience:</b> Learned to build defensive software with local heuristic fallbacks, proper CORS configurations, and graceful error handling.",
            "<b>Overall Internship Experience:</b> An incredibly rewarding, hands-on opportunity to bridge cutting-edge AI models with production-grade web applications under real-world engineering standards."
        ]
    }
]

# ----------------------------------------------------
# 1. BUILD PPTX PRESENTATION
# ----------------------------------------------------
def create_pptx():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Colors
    BG_COLOR = RGBColor(15, 23, 42)       # Slate 900
    CARD_BG = RGBColor(30, 41, 59)        # Slate 800
    TEXT_MAIN = RGBColor(241, 245, 249)   # Slate 100
    TEXT_MUTED = RGBColor(148, 163, 184) # Slate 400
    ACCENT_PURPLE = RGBColor(139, 92, 246)# Purple 500

    for item in SLIDES_DATA:
        slide = prs.slides.add_slide(blank_layout)

        # Slide Background Shape
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()

        # Title & Subtitle Header
        header_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.2))
        tf = header_box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = f"Slide {item['num']}: {item['title']}"
        p1.font.size = Pt(26)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_PURPLE
        
        p2 = tf.add_paragraph()
        p2.text = item['subtitle']
        p2.font.size = Pt(14)
        p2.font.color.rgb = TEXT_MUTED
        p2.space_before = Pt(4)

        if item['type'] == 'title':
            # Title slide details grid
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.5), Inches(2.0), Inches(10.333), Inches(4.8))
            card.fill.solid()
            card.fill.fore_color.rgb = CARD_BG
            card.line.color.rgb = ACCENT_PURPLE
            
            ctf = card.text_frame
            ctf.word_wrap = True
            ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
            
            for idx, (label, val) in enumerate(item['details']):
                p = ctf.paragraphs[0] if idx == 0 else ctf.add_paragraph()
                p.text = f"• {label}: {val}"
                p.font.size = Pt(18)
                p.font.color.rgb = TEXT_MAIN
                p.space_after = Pt(12)

        elif item['type'] == 'content':
            # Content slide with bullets box
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.9), Inches(11.733), Inches(5.0))
            card.fill.solid()
            card.fill.fore_color.rgb = CARD_BG
            card.line.color.rgb = RGBColor(51, 65, 85)
            
            ctf = card.text_frame
            ctf.word_wrap = True
            
            for idx, bullet in enumerate(item['bullets']):
                clean_bullet = bullet.replace("<b>", "").replace("</b>", "").replace("<font color='#8B5CF6'><u>", "").replace("</u></font>", "").replace("<code>", "").replace("</code>", "")
                p = ctf.paragraphs[0] if idx == 0 else ctf.add_paragraph()
                p.text = f"• {clean_bullet}"
                p.font.size = Pt(16)
                p.font.color.rgb = TEXT_MAIN
                p.space_after = Pt(14)

        elif item['type'] in ['image_left', 'image_right']:
            # Image + Content side by side
            img_left = (item['type'] == 'image_left')
            img_x = Inches(0.8) if img_left else Inches(6.8)
            text_x = Inches(6.8) if img_left else Inches(0.8)

            # Add Image if file exists
            if os.path.exists(item['image']):
                slide.shapes.add_picture(item['image'], img_x, Inches(1.9), Inches(5.7), Inches(5.0))

            # Text Card
            card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, text_x, Inches(1.9), Inches(5.7), Inches(5.0))
            card.fill.solid()
            card.fill.fore_color.rgb = CARD_BG
            card.line.color.rgb = RGBColor(51, 65, 85)
            
            ctf = card.text_frame
            ctf.word_wrap = True
            
            for idx, bullet in enumerate(item['bullets']):
                clean_bullet = bullet.replace("<b>", "").replace("</b>", "").replace("<font color='#8B5CF6'><u>", "").replace("</u></font>", "").replace("<code>", "").replace("</code>", "")
                p = ctf.paragraphs[0] if idx == 0 else ctf.add_paragraph()
                p.text = f"• {clean_bullet}"
                p.font.size = Pt(14)
                p.font.color.rgb = TEXT_MAIN
                p.space_after = Pt(10)

    prs.save(PPTX_PATH)
    print(f"[OK] Successfully created PPTX: {PPTX_PATH}")

# ----------------------------------------------------
# 2. BUILD PDF PRESENTATION (REPORTLAB)
# ----------------------------------------------------
def create_pdf():
    # 16:9 Landscape Page Size (10 x 5.625 inches = 720 x 405 pt)
    PAGE_WIDTH = 720
    PAGE_HEIGHT = 405

    doc = SimpleDocTemplate(
        PDF_PATH,
        pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        leftMargin=30,
        rightMargin=30,
        topMargin=25,
        bottomMargin=25
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'SlideTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#8B5CF6'),
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'SlideSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#94A3B8'),
        spaceAfter=12
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#F1F5F9'),
        spaceAfter=8
    )

    story = []

    def draw_bg(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor('#0F172A'))
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)
        canvas.restoreState()

    for idx, item in enumerate(SLIDES_DATA):
        # Header
        story.append(Paragraph(f"Slide {item['num']}: {item['title']}", title_style))
        story.append(Paragraph(item['subtitle'], subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#334155'), spaceAfter=12))

        if item['type'] == 'title':
            table_data = []
            for label, val in item['details']:
                p_label = Paragraph(f"<b>{label}:</b>", ParagraphStyle('Lbl', parent=bullet_style, textColor=colors.HexColor('#8B5CF6')))
                p_val = Paragraph(val, bullet_style)
                table_data.append([p_label, p_val])

            t = Table(table_data, colWidths=[140, 500])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('PADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#8B5CF6')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
            ]))
            story.append(t)

        elif item['type'] == 'content':
            bullet_paras = []
            for b in item['bullets']:
                bullet_paras.append([Paragraph(f"• {b}", bullet_style)])
            
            t = Table(bullet_paras, colWidths=[660])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1E293B')),
                ('PADDING', (0,0), (-1,-1), 8),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#334155')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
            ]))
            story.append(t)

        elif item['type'] in ['image_left', 'image_right']:
            bullet_paras = []
            for b in item['bullets']:
                bullet_paras.append(Paragraph(f"• {b}", ParagraphStyle('CompactBullet', parent=bullet_style, fontSize=9.5, leading=13)))

            text_table = Table([[bp] for bp in bullet_paras], colWidths=[310])
            text_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1E293B')),
                ('PADDING', (0,0), (-1,-1), 6),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#334155')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#334155')),
            ]))

            img_flowable = None
            if os.path.exists(item['image']):
                img_flowable = Image(item['image'], width=330, height=210)

            if item['type'] == 'image_left':
                col1, col2 = img_flowable, text_table
            else:
                col1, col2 = text_table, img_flowable

            split_table = Table([[col1, col2]], colWidths=[330, 330])
            split_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(split_table)

        if idx < len(SLIDES_DATA) - 1:
            story.append(PageBreak())

    doc.build(story, onFirstPage=draw_bg, onLaterPages=draw_bg)
    
    # Also write alias copy for convenient access
    with open(PDF_PATH, 'rb') as f_in:
        with open(PDF_ALIAS_PATH, 'wb') as f_out:
            f_out.write(f_in.read())

    print(f"[OK] Successfully created PDF: {PDF_PATH}")
    print(f"[OK] Successfully created PDF alias: {PDF_ALIAS_PATH}")

if __name__ == '__main__':
    create_pptx()
    create_pdf()
