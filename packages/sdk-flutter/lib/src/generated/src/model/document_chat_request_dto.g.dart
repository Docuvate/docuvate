// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatRequestDto extends DocumentChatRequestDto {
  @override
  final String message;
  @override
  final BuiltList<ChatMessageDto>? history;

  factory _$DocumentChatRequestDto(
          [void Function(DocumentChatRequestDtoBuilder)? updates]) =>
      (DocumentChatRequestDtoBuilder()..update(updates))._build();

  _$DocumentChatRequestDto._({required this.message, this.history}) : super._();
  @override
  DocumentChatRequestDto rebuild(
          void Function(DocumentChatRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatRequestDtoBuilder toBuilder() =>
      DocumentChatRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatRequestDto &&
        message == other.message &&
        history == other.history;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, history.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatRequestDto')
          ..add('message', message)
          ..add('history', history))
        .toString();
  }
}

class DocumentChatRequestDtoBuilder
    implements Builder<DocumentChatRequestDto, DocumentChatRequestDtoBuilder> {
  _$DocumentChatRequestDto? _$v;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  ListBuilder<ChatMessageDto>? _history;
  ListBuilder<ChatMessageDto> get history =>
      _$this._history ??= ListBuilder<ChatMessageDto>();
  set history(ListBuilder<ChatMessageDto>? history) =>
      _$this._history = history;

  DocumentChatRequestDtoBuilder() {
    DocumentChatRequestDto._defaults(this);
  }

  DocumentChatRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _message = $v.message;
      _history = $v.history?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatRequestDto other) {
    _$v = other as _$DocumentChatRequestDto;
  }

  @override
  void update(void Function(DocumentChatRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatRequestDto build() => _build();

  _$DocumentChatRequestDto _build() {
    _$DocumentChatRequestDto _$result;
    try {
      _$result = _$v ??
          _$DocumentChatRequestDto._(
            message: BuiltValueNullFieldError.checkNotNull(
                message, r'DocumentChatRequestDto', 'message'),
            history: _history?.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'history';
        _history?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentChatRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
