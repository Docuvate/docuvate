// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'send_document_chat_thread_message_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SendDocumentChatThreadMessageResponseDto
    extends SendDocumentChatThreadMessageResponseDto {
  @override
  final ChatMessageRecordDto userMessage;
  @override
  final ChatMessageRecordDto assistantMessage;
  @override
  final bool? asyncGeneration;
  @override
  final ChatMessageDto reply;
  @override
  final bool configured;
  @override
  final String? provider;
  @override
  final String? setupHint;

  factory _$SendDocumentChatThreadMessageResponseDto(
          [void Function(SendDocumentChatThreadMessageResponseDtoBuilder)?
              updates]) =>
      (SendDocumentChatThreadMessageResponseDtoBuilder()..update(updates))
          ._build();

  _$SendDocumentChatThreadMessageResponseDto._(
      {required this.userMessage,
      required this.assistantMessage,
      this.asyncGeneration,
      required this.reply,
      required this.configured,
      this.provider,
      this.setupHint})
      : super._();
  @override
  SendDocumentChatThreadMessageResponseDto rebuild(
          void Function(SendDocumentChatThreadMessageResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SendDocumentChatThreadMessageResponseDtoBuilder toBuilder() =>
      SendDocumentChatThreadMessageResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SendDocumentChatThreadMessageResponseDto &&
        userMessage == other.userMessage &&
        assistantMessage == other.assistantMessage &&
        asyncGeneration == other.asyncGeneration &&
        reply == other.reply &&
        configured == other.configured &&
        provider == other.provider &&
        setupHint == other.setupHint;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, userMessage.hashCode);
    _$hash = $jc(_$hash, assistantMessage.hashCode);
    _$hash = $jc(_$hash, asyncGeneration.hashCode);
    _$hash = $jc(_$hash, reply.hashCode);
    _$hash = $jc(_$hash, configured.hashCode);
    _$hash = $jc(_$hash, provider.hashCode);
    _$hash = $jc(_$hash, setupHint.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'SendDocumentChatThreadMessageResponseDto')
          ..add('userMessage', userMessage)
          ..add('assistantMessage', assistantMessage)
          ..add('asyncGeneration', asyncGeneration)
          ..add('reply', reply)
          ..add('configured', configured)
          ..add('provider', provider)
          ..add('setupHint', setupHint))
        .toString();
  }
}

class SendDocumentChatThreadMessageResponseDtoBuilder
    implements
        Builder<SendDocumentChatThreadMessageResponseDto,
            SendDocumentChatThreadMessageResponseDtoBuilder> {
  _$SendDocumentChatThreadMessageResponseDto? _$v;

  ChatMessageRecordDtoBuilder? _userMessage;
  ChatMessageRecordDtoBuilder get userMessage =>
      _$this._userMessage ??= ChatMessageRecordDtoBuilder();
  set userMessage(ChatMessageRecordDtoBuilder? userMessage) =>
      _$this._userMessage = userMessage;

  ChatMessageRecordDtoBuilder? _assistantMessage;
  ChatMessageRecordDtoBuilder get assistantMessage =>
      _$this._assistantMessage ??= ChatMessageRecordDtoBuilder();
  set assistantMessage(ChatMessageRecordDtoBuilder? assistantMessage) =>
      _$this._assistantMessage = assistantMessage;

  bool? _asyncGeneration;
  bool? get asyncGeneration => _$this._asyncGeneration;
  set asyncGeneration(bool? asyncGeneration) =>
      _$this._asyncGeneration = asyncGeneration;

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

  SendDocumentChatThreadMessageResponseDtoBuilder() {
    SendDocumentChatThreadMessageResponseDto._defaults(this);
  }

  SendDocumentChatThreadMessageResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _userMessage = $v.userMessage.toBuilder();
      _assistantMessage = $v.assistantMessage.toBuilder();
      _asyncGeneration = $v.asyncGeneration;
      _reply = $v.reply.toBuilder();
      _configured = $v.configured;
      _provider = $v.provider;
      _setupHint = $v.setupHint;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SendDocumentChatThreadMessageResponseDto other) {
    _$v = other as _$SendDocumentChatThreadMessageResponseDto;
  }

  @override
  void update(
      void Function(SendDocumentChatThreadMessageResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SendDocumentChatThreadMessageResponseDto build() => _build();

  _$SendDocumentChatThreadMessageResponseDto _build() {
    _$SendDocumentChatThreadMessageResponseDto _$result;
    try {
      _$result = _$v ??
          _$SendDocumentChatThreadMessageResponseDto._(
            userMessage: userMessage.build(),
            assistantMessage: assistantMessage.build(),
            asyncGeneration: asyncGeneration,
            reply: reply.build(),
            configured: BuiltValueNullFieldError.checkNotNull(configured,
                r'SendDocumentChatThreadMessageResponseDto', 'configured'),
            provider: provider,
            setupHint: setupHint,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'userMessage';
        userMessage.build();
        _$failedField = 'assistantMessage';
        assistantMessage.build();

        _$failedField = 'reply';
        reply.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'SendDocumentChatThreadMessageResponseDto',
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
