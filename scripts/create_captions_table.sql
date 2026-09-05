-- Create table for storing image captions and metadata
CREATE TABLE IF NOT EXISTS image_captions (
    id SERIAL PRIMARY KEY,
    image_url TEXT NOT NULL,
    image_name VARCHAR(255),
    generated_caption TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    model_used VARCHAR(50) DEFAULT 'resnet50_lstm',
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_image_captions_created_at ON image_captions(created_at);
CREATE INDEX IF NOT EXISTS idx_image_captions_model ON image_captions(model_used);

-- Create table for model performance metrics
CREATE TABLE IF NOT EXISTS model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(50) NOT NULL,
    dataset_name VARCHAR(50),
    bleu1_score DECIMAL(4,3),
    bleu2_score DECIMAL(4,3),
    bleu3_score DECIMAL(4,3),
    bleu4_score DECIMAL(4,3),
    meteor_score DECIMAL(4,3),
    cider_score DECIMAL(4,3),
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO image_captions (image_url, image_name, generated_caption, confidence_score, processing_time_ms) VALUES
('https://example.com/image1.jpg', 'sunset_beach.jpg', 'A beautiful sunset over a calm beach with gentle waves', 0.92, 1500),
('https://example.com/image2.jpg', 'city_skyline.jpg', 'A modern city skyline with tall buildings and bright lights at night', 0.88, 1200),
('https://example.com/image3.jpg', 'mountain_lake.jpg', 'A serene mountain lake surrounded by pine trees and rocky peaks', 0.95, 1800);

-- Insert sample model metrics
INSERT INTO model_metrics (model_name, dataset_name, bleu1_score, bleu2_score, bleu3_score, bleu4_score, meteor_score, cider_score) VALUES
('resnet50_lstm', 'COCO_2017', 0.756, 0.583, 0.441, 0.335, 0.271, 1.123),
('vgg16_gru', 'COCO_2017', 0.742, 0.571, 0.428, 0.321, 0.265, 1.089),
('resnet101_attention', 'COCO_2017', 0.781, 0.612, 0.471, 0.361, 0.289, 1.201);

COMMIT;
