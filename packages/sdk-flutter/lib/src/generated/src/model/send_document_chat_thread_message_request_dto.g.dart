// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'send_document_chat_thread_message_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SendDocumentChatThreadMessageRequestDto
    extends SendDocumentChatThreadMessageRequestDto {
  @override
  final String message;

  factory _$SendDocumentChatThreadMessageRequestDto(
          [void Function(SendDocumentChatThreadMessageRequestDtoBuilder)?
              updates]) =>
      (SendDocumentChatThreadMessageRequestDtoBuilder()..update(updates))
          ._build();

  _$SendDocumentChatThreadMessageRequestDto._({required this.message})
      : super._();
  @override
  SendDocumentChatThreadMessageRequestDto rebuild(
          void Function(SendDocumentChatThreadMessageRequestDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SendDocumentChatThreadMessageRequestDtoBuilder toBuilder() =>
      SendDocumentChatThreadMessageRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendDocumentChatThreadMessageRequestDto &&
        message == other.message;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'SendDocumentChatThreadMessageRequestDto')
          ..add('message', message))
        .toString();
  }
}

class SendDocumentChatThreadMessageRequestDtoBuilder
    implements
        Builder<SendDocumentChatThreadMessageRequestDto,
            SendDocumentChatThreadMessageRequestDtoBuilder> {
  _$SendDocumentChatThreadMessageRequestDto? _$v;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  SendDocumentChatThreadMessageRequestDtoBuilder() {
    SendDocumentChatThreadMessageRequestDto._defaults(this);
  }

  SendDocumentChatThreadMessageRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _message = $v.message;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendDocumentChatThreadMessageRequestDto other) {
    _$v = other as _$SendDocumentChatThreadMessageRequestDto;
  }

  @override
  void update(
      void Function(SendDocumentChatThreadMessageRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendDocumentChatThreadMessageRequestDto build() => _build();

  _$SendDocumentChatThreadMessageRequestDto _build() {
    final _$result = _$v ??
        _$SendDocumentChatThreadMessageRequestDto._(
          message: BuiltValueNullFieldError.checkNotNull(
              message, r'SendDocumentChatThreadMessageRequestDto', 'message'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
