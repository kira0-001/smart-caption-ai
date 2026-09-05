"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ModelArchitecture() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Image Captioning Model Architecture</CardTitle>
        <CardDescription>Understanding the neural network components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CNN Feature Extractor */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">CNN</Badge>
              <h3 className="font-semibold">Feature Extractor</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">VGG16/19</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• 16-19 layers deep</li>
                  <li>• 3x3 convolution filters</li>
                  <li>• Max pooling layers</li>
                  <li>• 4096-dim feature vector</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">ResNet50/101</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Residual connections</li>
                  <li>• Skip connections</li>
                  <li>• Batch normalization</li>
                  <li>• 2048-dim features</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">EfficientNet</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Compound scaling</li>
                  <li>• Mobile-optimized</li>
                  <li>• High accuracy</li>
                  <li>• Variable dimensions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RNN/Transformer Decoder */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">RNN/Transformer</Badge>
              <h3 className="font-semibold">Caption Generator</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">LSTM/GRU</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Sequential processing</li>
                  <li>• Memory cells</li>
                  <li>• Attention mechanisms</li>
                  <li>• Word-by-word generation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Transformer</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Self-attention layers</li>
                  <li>• Parallel processing</li>
                  <li>• Positional encoding</li>
                  <li>• Better long-range deps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Training Process */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">Training</Badge>
              <h3 className="font-semibold">Model Training</h3>
            </div>
            <div className="text-sm space-y-2">
              <p>
                <strong>Dataset:</strong> COCO, Flickr30k, Visual Genome (images + captions)
              </p>
              <p>
                <strong>Loss Function:</strong> Cross-entropy loss for next word prediction
              </p>
              <p>
                <strong>Optimization:</strong> Adam optimizer with learning rate scheduling
              </p>
              <p>
                <strong>Evaluation:</strong> BLEU, METEOR, CIDEr, ROUGE-L metrics
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
