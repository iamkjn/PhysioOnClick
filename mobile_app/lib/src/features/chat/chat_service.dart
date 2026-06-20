import 'dart:async';
import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

// Change to https://physioonclick.com for release
const _baseUrl = 'http://10.0.2.2:3000'; // Android emulator; use http://localhost:3000 for iOS simulator

class ChatMessage {
  final String role; // 'user' or 'model'
  final String text;
  final ChatAction? action;

  const ChatMessage({required this.role, required this.text, this.action});

  Map<String, dynamic> toJson() => {'role': role, 'text': text};
}

class ChatAction {
  final String type;
  final String label;
  final String url;

  const ChatAction({required this.type, required this.label, required this.url});

  factory ChatAction.fromJson(Map<String, dynamic> json) => ChatAction(
        type: json['type'] as String,
        label: json['label'] as String,
        url: json['url'] as String,
      );
}

class ChatService {
  String? _sessionId;

  Future<ChatMessage> sendMessage(
    String message,
    List<ChatMessage> history,
  ) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      String? token;
      if (user != null) {
        token = await user.getIdToken();
      }

      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

      final body = jsonEncode({
        'message': message,
        if (_sessionId != null) 'sessionId': _sessionId,
        'history': history.map((m) => m.toJson()).toList(),
      });

      final uri = Uri.parse('$_baseUrl/api/chat');
      final response = await http
          .post(uri, headers: headers, body: body)
          .timeout(const Duration(seconds: 15));

      if (response.statusCode != 200) {
        return const ChatMessage(
          role: 'model',
          text: "Sorry, I'm having trouble right now. Please try again later.",
        );
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      _sessionId = data['sessionId'] as String?;

      ChatAction? action;
      if (data['action'] != null) {
        action = ChatAction.fromJson(data['action'] as Map<String, dynamic>);
      }

      return ChatMessage(
        role: 'model',
        text: data['reply'] as String,
        action: action,
      );
    } catch (_) {
      return const ChatMessage(
        role: 'model',
        text: "Sorry, I'm having trouble right now. Please check your connection and try again.",
      );
    }
  }
}
