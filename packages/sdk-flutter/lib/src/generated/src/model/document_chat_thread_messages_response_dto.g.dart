// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_thread_messages_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatThreadMessagesResponseDto
    extends DocumentChatThreadMessagesResponseDto {
  @override
  final BuiltList<ChatMessageRecordDto> messages;

  factory _$DocumentChatThreadMessagesResponseDto(
          [void Function(DocumentChatThreadMessagesResponseDtoBuilder)?
              updates]) =>
      (DocumentChatThreadMessagesResponseDtoBuilder()..update(updates))
          ._build();

  _$DocumentChatThreadMessagesResponseDto._({required this.messages})
      : super._();
  @override
  DocumentChatThreadMessagesResponseDto rebuild(
          void Function(DocumentChatThreadMessagesResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatThreadMessagesResponseDtoBuilder toBuilder() =>
      DocumentChatThreadMessagesResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatThreadMessagesResponseDto &&
        messages == other.messages;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, messages.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DocumentChatThreadMessagesResponseDto')
          ..add('messages', messages))
        .toString();
  }
}

class DocumentChatThreadMessagesResponseDtoBuilder
    implements
        Builder<DocumentChatThreadMessagesResponseDto,
            DocumentChatThreadMessagesResponseDtoBuilder> {
  _$DocumentChatThreadMessagesResponseDto? _$v;

  ListBuilder<ChatMessageRecordDto>? _messages;
  ListBuilder<ChatMessageRecordDto> get messages =>
      _$this._messages ??= ListBuilder<ChatMessageRecordDto>();
  set messages(ListBuilder<ChatMessageRecordDto>? messages) =>
      _$this._messages = messages;

  DocumentChatThreadMessagesResponseDtoBuilder() {
    DocumentChatThreadMessagesResponseDto._defaults(this);
  }

  DocumentChatThreadMessagesResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _messages = $v.messages.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatThreadMessagesResponseDto other) {
    _$v = other as _$DocumentChatThreadMessagesResponseDto;
  }

  @override
  void update(
      void Function(DocumentChatThreadMessagesResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatThreadMessagesResponseDto build() => _build();

  _$DocumentChatThreadMessagesResponseDto _build() {
    _$DocumentChatThreadMessagesResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentChatThreadMessagesResponseDto._(
            messages: messages.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'messages';
        messages.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentChatThreadMessagesResponseDto',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
