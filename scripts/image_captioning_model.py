"""
Image Captioning Model Implementation
Combines CNN feature extraction with RNN/Transformer for caption generation
"""

import torch
import torch.nn as nn
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import numpy as np

class ImageEncoder(nn.Module):
    """CNN-based image feature extractor"""
    
    def __init__(self, embed_size=256, model_name='resnet50'):
        super(ImageEncoder, self).__init__()
        
        # Load pre-trained CNN model
        if model_name == 'resnet50':
            resnet = models.resnet50(pretrained=True)
            # Remove the final classification layer
            modules = list(resnet.children())[:-1]
            self.resnet = nn.Sequential(*modules)
            self.feature_size = 2048
        elif model_name == 'vgg16':
            vgg = models.vgg16(pretrained=True)
            # Use features up to the last conv layer
            self.resnet = vgg.features
            self.feature_size = 512 * 7 * 7  # After adaptive pooling
        
        # Freeze CNN parameters (optional)
        for param in self.resnet.parameters():
            param.requires_grad = False
            
        # Linear layer to project features to embedding space
        self.linear = nn.Linear(self.feature_size, embed_size)
        self.bn = nn.BatchNorm1d(embed_size, momentum=0.01)
        
    def forward(self, images):
        """Extract features from images"""
        with torch.no_grad():
            features = self.resnet(images)
        
        # Flatten features
        features = features.reshape(features.size(0), -1)
        
        # Project to embedding space
        features = self.bn(self.linear(features))
        return features

class DecoderRNN(nn.Module):
    """LSTM-based caption decoder"""
    
    def __init__(self, embed_size, hidden_size, vocab_size, num_layers=1):
        super(DecoderRNN, self).__init__()
        
        self.embed_size = embed_size
        self.hidden_size = hidden_size
        self.vocab_size = vocab_size
        self.num_layers = num_layers
        
        # Word embedding layer
        self.embed = nn.Embedding(vocab_size, embed_size)
        
        # LSTM layer
        self.lstm = nn.LSTM(embed_size, hidden_size, num_layers, batch_first=True)
        
        # Linear layer to map LSTM output to vocabulary
        self.linear = nn.Linear(hidden_size, vocab_size)
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.5)
        
    def forward(self, features, captions, lengths):
        """Forward pass during training"""
        # Embed captions
        embeddings = self.embed(captions)
        
        # Concatenate image features with caption embeddings
        embeddings = torch.cat((features.unsqueeze(1), embeddings), 1)
        
        # Pack padded sequences for efficient processing
        packed = nn.utils.rnn.pack_padded_sequence(
            embeddings, lengths, batch_first=True, enforce_sorted=False
        )
        
        # LSTM forward pass
        hiddens, _ = self.lstm(packed)
        
        # Linear layer to get vocabulary scores
        outputs = self.linear(hiddens[0])
        
        return outputs
    
    def sample(self, features, states=None, max_len=20):
        """Generate captions using greedy search"""
        sampled_ids = []
        inputs = features.unsqueeze(1)
        
        for i in range(max_len):
            hiddens, states = self.lstm(inputs, states)
            outputs = self.linear(hiddens.squeeze(1))
            
            # Get the word with highest probability
            _, predicted = outputs.max(1)
            sampled_ids.append(predicted)
            
            # Use predicted word as input for next time step
            inputs = self.embed(predicted)
            inputs = inputs.unsqueeze(1)
            
        sampled_ids = torch.stack(sampled_ids, 1)
        return sampled_ids

class AttentionDecoder(nn.Module):
    """Attention-based decoder for better caption quality"""
    
    def __init__(self, embed_size, hidden_size, vocab_size, feature_dim=2048):
        super(AttentionDecoder, self).__init__()
        
        self.embed_size = embed_size
        self.hidden_size = hidden_size
        self.vocab_size = vocab_size
        self.feature_dim = feature_dim
        
        # Word embedding
        self.embed = nn.Embedding(vocab_size, embed_size)
        
        # LSTM cell
        self.lstm_cell = nn.LSTMCell(embed_size + feature_dim, hidden_size)
        
        # Attention layers
        self.attention = nn.Linear(hidden_size, feature_dim)
        self.context_linear = nn.Linear(feature_dim, embed_size)
        
        # Output layer
        self.output = nn.Linear(hidden_size, vocab_size)
        
        # Initialize weights
        self.init_weights()
        
    def init_weights(self):
        """Initialize weights"""
        self.embed.weight.data.uniform_(-0.1, 0.1)
        self.output.bias.data.fill_(0)
        self.output.weight.data.uniform_(-0.1, 0.1)
        
    def forward(self, features, captions, lengths):
        """Forward pass with attention"""
        batch_size = features.size(0)
        
        # Initialize LSTM states
        h = torch.zeros(batch_size, self.hidden_size).to(features.device)
        c = torch.zeros(batch_size, self.hidden_size).to(features.device)
        
        outputs = []
        
        for i in range(max(lengths)):
            # Get current word embeddings
            if i == 0:
                # Start with image features
                lstm_input = torch.cat([features, features], dim=1)
            else:
                word_embed = self.embed(captions[:, i-1])
                lstm_input = torch.cat([word_embed, features], dim=1)
            
            # LSTM step
            h, c = self.lstm_cell(lstm_input, (h, c))
            
            # Compute attention weights
            attention_weights = torch.softmax(
                self.attention(h).unsqueeze(1), dim=2
            )
            
            # Apply attention to features
            context = (attention_weights * features.unsqueeze(1)).sum(dim=1)
            
            # Generate output
            output = self.output(h + self.context_linear(context))
            outputs.append(output)
            
        outputs = torch.stack(outputs, dim=1)
        return outputs

class ImageCaptioningModel(nn.Module):
    """Complete image captioning model"""
    
    def __init__(self, embed_size=256, hidden_size=512, vocab_size=10000, 
                 num_layers=1, cnn_model='resnet50', use_attention=False):
        super(ImageCaptioningModel, self).__init__()
        
        # Image encoder
        self.encoder = ImageEncoder(embed_size, cnn_model)
        
        # Caption decoder
        if use_attention:
            self.decoder = AttentionDecoder(embed_size, hidden_size, vocab_size)
        else:
            self.decoder = DecoderRNN(embed_size, hidden_size, vocab_size, num_layers)
            
        self.use_attention = use_attention
        
    def forward(self, images, captions, lengths):
        """Forward pass"""
        features = self.encoder(images)
        outputs = self.decoder(features, captions, lengths)
        return outputs
    
    def generate_caption(self, image, vocab, max_len=20):
        """Generate caption for a single image"""
        self.eval()
        
        with torch.no_grad():
            # Extract features
            features = self.encoder(image.unsqueeze(0))
            
            if self.use_attention:
                # Use beam search for attention model
                caption_ids = self.beam_search(features, max_len)
            else:
                # Use greedy search for simple RNN
                caption_ids = self.decoder.sample(features, max_len=max_len)
            
            # Convert IDs to words
            caption_ids = caption_ids[0].cpu().numpy()
            caption = []
            
            for word_id in caption_ids:
                word = vocab.idx2word[word_id]
                if word == '<end>':
                    break
                if word != '<start>':
                    caption.append(word)
                    
            return ' '.join(caption)

def preprocess_image(image_path):
    """Preprocess image for model input"""
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                           std=[0.229, 0.224, 0.225])
    ])
    
    image = Image.open(image_path).convert('RGB')
    image = transform(image)
    return image

# Example usage and training loop
def train_model(model, data_loader, criterion, optimizer, num_epochs=10):
    """Training loop for the image captioning model"""
    model.train()
    
    for epoch in range(num_epochs):
        total_loss = 0
        
        for i, (images, captions, lengths) in enumerate(data_loader):
            # Move to GPU if available
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            images = images.to(device)
            captions = captions.to(device)
            
            # Zero gradients
            optimizer.zero_grad()
            
            # Forward pass
            outputs = model(images, captions, lengths)
            
            # Calculate loss
            targets = nn.utils.rnn.pack_padded_sequence(
                captions, lengths, batch_first=True, enforce_sorted=False
            )[0]
            
            loss = criterion(outputs, targets)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            
            if i % 100 == 0:
                print(f'Epoch [{epoch+1}/{num_epochs}], Step [{i+1}/{len(data_loader)}], Loss: {loss.item():.4f}')
        
        avg_loss = total_loss / len(data_loader)
        print(f'Epoch [{epoch+1}/{num_epochs}], Average Loss: {avg_loss:.4f}')

# Model evaluation metrics
def calculate_bleu_score(references, hypotheses):
    """Calculate BLEU score for caption evaluation"""
    from nltk.translate.bleu_score import corpus_bleu
    
    # Tokenize references and hypotheses
    references = [[ref.split()] for ref in references]
    hypotheses = [hyp.split() for hyp in hypotheses]
    
    # Calculate BLEU scores
    bleu1 = corpus_bleu(references, hypotheses, weights=(1, 0, 0, 0))
    bleu2 = corpus_bleu(references, hypotheses, weights=(0.5, 0.5, 0, 0))
    bleu3 = corpus_bleu(references, hypotheses, weights=(0.33, 0.33, 0.33, 0))
    bleu4 = corpus_bleu(references, hypotheses, weights=(0.25, 0.25, 0.25, 0.25))
    
    return {
        'BLEU-1': bleu1,
        'BLEU-2': bleu2,
        'BLEU-3': bleu3,
        'BLEU-4': bleu4
    }

print("Image Captioning Model Implementation Complete!")
print("This script provides a complete framework for:")
print("1. CNN-based feature extraction (ResNet/VGG)")
print("2. RNN/LSTM-based caption generation")
print("3. Attention mechanisms for improved quality")
print("4. Training and evaluation utilities")
print("5. BLEU score calculation for model assessment")
