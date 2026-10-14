// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatResponseDto extends DocumentChatResponseDto {
  @override
  final ChatMessageDto reply;
  @override
  final bool configured;
  @override
  final String? provider;
  @override
  final String? setupHint;

  factory _$DocumentChatResponseDto(
          [void Function(DocumentChatResponseDtoBuilder)? updates]) =>
      (DocumentChatResponseDtoBuilder()..update(updates))._build();

  _$DocumentChatResponseDto._(
      {required this.reply,
      required this.configured,
      this.provider,
      this.setupHint})
      : super._();
  @override
  DocumentChatResponseDto rebuild(
          void Function(DocumentChatResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatResponseDtoBuilder toBuilder() =>
      DocumentChatResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatResponseDto &&
        reply == other.reply &&
        configured == other.configured &&
        provider == other.provider &&
        setupHint == other.setupHint;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, reply.hashCode);
    _$hash = $jc(_$hash, configured.hashCode);
    _$hash = $jc(_$hash, provider.hashCode);
    _$hash = $jc(_$hash, setupHint.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatResponseDto')
          ..add('reply', reply)
          ..add('configured', configured)
          ..add('provider', provider)
          ..add('setupHint', setupHint))
        .toString();
  }
}

class DocumentChatResponseDtoBuilder
    implements
        Builder<DocumentChatResponseDto, DocumentChatResponseDtoBuilder> {
  _$DocumentChatResponseDto? _$v;

  ChatMessageDtoBuilder? _reply;
  ChatMessageDtoBuilder get reply => _$this._reply ??= ChatMessageDtoBuilder();
  set reply(ChatMessageDtoBuilder? reply) => _$this._reply = reply;

  bool? _configured;
  bool? get configured => _$this._configured;
  set configured(bool? configured) => _$this._configured = configured;

  String? _provider;
  String? get provider => _$this._provider;
  set provider(String? provider) => _$this._provider = provider;

  String? _setupHint;
  String? get setupHint => _$this._setupHint;
  set setupHint(String? setupHint) => _$this._setupHint = setupHint;

  DocumentChatResponseDtoBuilder() {
    DocumentChatResponseDto._defaults(this);
  }

  DocumentChatResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _reply = $v.reply.toBuilder();
      _configured = $v.configured;
      _provider = $v.provider;
      _setupHint = $v.setupHint;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatResponseDto other) {
    _$v = other as _$DocumentChatResponseDto;
  }

  @override
  void update(void Function(DocumentChatResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatResponseDto build() => _build();

  _$DocumentChatResponseDto _build() {
    _$DocumentChatResponseDto _$result;
    try {
      _$result = _$v ??
          _$DocumentChatResponseDto._(
            reply: reply.build(),
            configured: BuiltValueNullFieldError.checkNotNull(
                configured, r'DocumentChatResponseDto', 'configured'),
            provider: provider,
            setupHint: setupHint,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'reply';
        reply.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'DocumentChatResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
