// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_message_record_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ChatMessageRecordDtoRoleEnum _$chatMessageRecordDtoRoleEnum_user =
    const ChatMessageRecordDtoRoleEnum._('user');
const ChatMessageRecordDtoRoleEnum _$chatMessageRecordDtoRoleEnum_assistant =
    const ChatMessageRecordDtoRoleEnum._('assistant');

ChatMessageRecordDtoRoleEnum _$chatMessageRecordDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'user':
      return _$chatMessageRecordDtoRoleEnum_user;
    case 'assistant':
      return _$chatMessageRecordDtoRoleEnum_assistant;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ChatMessageRecordDtoRoleEnum>
    _$chatMessageRecordDtoRoleEnumValues = new BuiltSet<
        ChatMessageRecordDtoRoleEnum>(const <ChatMessageRecordDtoRoleEnum>[
  _$chatMessageRecordDtoRoleEnum_user,
  _$chatMessageRecordDtoRoleEnum_assistant,
]);

const ChatMessageRecordDtoGenerationStatusEnum
    _$chatMessageRecordDtoGenerationStatusEnum_failed =
    const ChatMessageRecordDtoGenerationStatusEnum._('failed');
const ChatMessageRecordDtoGenerationStatusEnum
    _$chatMessageRecordDtoGenerationStatusEnum_pending =
    const ChatMessageRecordDtoGenerationStatusEnum._('pending');
const ChatMessageRecordDtoGenerationStatusEnum
    _$chatMessageRecordDtoGenerationStatusEnum_streaming =
    const ChatMessageRecordDtoGenerationStatusEnum._('streaming');
const ChatMessageRecordDtoGenerationStatusEnum
    _$chatMessageRecordDtoGenerationStatusEnum_done =
    const ChatMessageRecordDtoGenerationStatusEnum._('done');

ChatMessageRecordDtoGenerationStatusEnum
    _$chatMessageRecordDtoGenerationStatusEnumValueOf(String name) {
  switch (name) {
    case 'failed':
      return _$chatMessageRecordDtoGenerationStatusEnum_failed;
    case 'pending':
      return _$chatMessageRecordDtoGenerationStatusEnum_pending;
    case 'streaming':
      return _$chatMessageRecordDtoGenerationStatusEnum_streaming;
    case 'done':
      return _$chatMessageRecordDtoGenerationStatusEnum_done;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ChatMessageRecordDtoGenerationStatusEnum>
    _$chatMessageRecordDtoGenerationStatusEnumValues = new BuiltSet<
        ChatMessageRecordDtoGenerationStatusEnum>(const <ChatMessageRecordDtoGenerationStatusEnum>[
  _$chatMessageRecordDtoGenerationStatusEnum_failed,
  _$chatMessageRecordDtoGenerationStatusEnum_pending,
  _$chatMessageRecordDtoGenerationStatusEnum_streaming,
  _$chatMessageRecordDtoGenerationStatusEnum_done,
]);

const ChatMessageRecordDtoGenerationPhaseEnum
    _$chatMessageRecordDtoGenerationPhaseEnum_retrieving =
    const ChatMessageRecordDtoGenerationPhaseEnum._('retrieving');
const ChatMessageRecordDtoGenerationPhaseEnum
    _$chatMessageRecordDtoGenerationPhaseEnum_generating =
    const ChatMessageRecordDtoGenerationPhaseEnum._('generating');

ChatMessageRecordDtoGenerationPhaseEnum
    _$chatMessageRecordDtoGenerationPhaseEnumValueOf(String name) {
  switch (name) {
    case 'retrieving':
      return _$chatMessageRecordDtoGenerationPhaseEnum_retrieving;
    case 'generating':
      return _$chatMessageRecordDtoGenerationPhaseEnum_generating;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ChatMessageRecordDtoGenerationPhaseEnum>
    _$chatMessageRecordDtoGenerationPhaseEnumValues = new BuiltSet<
        ChatMessageRecordDtoGenerationPhaseEnum>(const <ChatMessageRecordDtoGenerationPhaseEnum>[
  _$chatMessageRecordDtoGenerationPhaseEnum_retrieving,
  _$chatMessageRecordDtoGenerationPhaseEnum_generating,
]);

Serializer<ChatMessageRecordDtoRoleEnum>
    _$chatMessageRecordDtoRoleEnumSerializer =
    new _$ChatMessageRecordDtoRoleEnumSerializer();
Serializer<ChatMessageRecordDtoGenerationStatusEnum>
    _$chatMessageRecordDtoGenerationStatusEnumSerializer =
    new _$ChatMessageRecordDtoGenerationStatusEnumSerializer();
Serializer<ChatMessageRecordDtoGenerationPhaseEnum>
    _$chatMessageRecordDtoGenerationPhaseEnumSerializer =
    new _$ChatMessageRecordDtoGenerationPhaseEnumSerializer();

class _$ChatMessageRecordDtoRoleEnumSerializer
    implements PrimitiveSerializer<ChatMessageRecordDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'user': 'user',
    'assistant': 'assistant',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user': 'user',
    'assistant': 'assistant',
  };

  @override
  final Iterable<Type> types = const <Type>[ChatMessageRecordDtoRoleEnum];
  @override
  final String wireName = 'ChatMessageRecordDtoRoleEnum';

  @override
  Object serialize(Serializers serializers, ChatMessageRecordDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ChatMessageRecordDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ChatMessageRecordDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ChatMessageRecordDtoGenerationStatusEnumSerializer
    implements PrimitiveSerializer<ChatMessageRecordDtoGenerationStatusEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'failed': 'failed',
    'pending': 'pending',
    'streaming': 'streaming',
    'done': 'done',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'failed': 'failed',
    'pending': 'pending',
    'streaming': 'streaming',
    'done': 'done',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ChatMessageRecordDtoGenerationStatusEnum
  ];
  @override
  final String wireName = 'ChatMessageRecordDtoGenerationStatusEnum';

  @override
  Object serialize(Serializers serializers,
          ChatMessageRecordDtoGenerationStatusEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ChatMessageRecordDtoGenerationStatusEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ChatMessageRecordDtoGenerationStatusEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ChatMessageRecordDtoGenerationPhaseEnumSerializer
    implements PrimitiveSerializer<ChatMessageRecordDtoGenerationPhaseEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'retrieving': 'retrieving',
    'generating': 'generating',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'retrieving': 'retrieving',
    'generating': 'generating',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ChatMessageRecordDtoGenerationPhaseEnum
  ];
  @override
  final String wireName = 'ChatMessageRecordDtoGenerationPhaseEnum';

  @override
  Object serialize(Serializers serializers,
          ChatMessageRecordDtoGenerationPhaseEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ChatMessageRecordDtoGenerationPhaseEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ChatMessageRecordDtoGenerationPhaseEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ChatMessageRecordDto extends ChatMessageRecordDto {
  @override
  final String id;
  @override
  final ChatMessageRecordDtoRoleEnum role;
  @override
  final String content;
  @override
  final String createdAt;
  @override
  final String? updatedAt;
  @override
  final ChatMessageRecordDtoGenerationStatusEnum? generationStatus;
  @override
  final ChatMessageRecordDtoGenerationPhaseEnum? generationPhase;
  @override
  final String? errorCode;

  factory _$ChatMessageRecordDto(
          [void Function(ChatMessageRecordDtoBuilder)? updates]) =>
      (new ChatMessageRecordDtoBuilder()..update(updates))._build();

  _$ChatMessageRecordDto._(
      {required this.id,
      required this.role,
      required this.content,
      required this.createdAt,
      this.updatedAt,
      this.generationStatus,
      this.generationPhase,
      this.errorCode})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'ChatMessageRecordDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        role, r'ChatMessageRecordDto', 'role');
    BuiltValueNullFieldError.checkNotNull(
        content, r'ChatMessageRecordDto', 'content');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'ChatMessageRecordDto', 'createdAt');
  }

  @override
  ChatMessageRecordDto rebuild(
          void Function(ChatMessageRecordDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ChatMessageRecordDtoBuilder toBuilder() =>
      new ChatMessageRecordDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ChatMessageRecordDto &&
        id == other.id &&
        role == other.role &&
        content == other.content &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt &&
        generationStatus == other.generationStatus &&
        generationPhase == other.generationPhase &&
        errorCode == other.errorCode;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jc(_$hash, generationStatus.hashCode);
    _$hash = $jc(_$hash, generationPhase.hashCode);
    _$hash = $jc(_$hash, errorCode.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ChatMessageRecordDto')
          ..add('id', id)
          ..add('role', role)
          ..add('content', content)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt)
          ..add('generationStatus', generationStatus)
          ..add('generationPhase', generationPhase)
          ..add('errorCode', errorCode))
        .toString();
  }
}

class ChatMessageRecordDtoBuilder
    implements Builder<ChatMessageRecordDto, ChatMessageRecordDtoBuilder> {
  _$ChatMessageRecordDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  ChatMessageRecordDtoRoleEnum? _role;
  ChatMessageRecordDtoRoleEnum? get role => _$this._role;
  set role(ChatMessageRecordDtoRoleEnum? role) => _$this._role = role;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  String? _updatedAt;
  String? get updatedAt => _$this._updatedAt;
  set updatedAt(String? updatedAt) => _$this._updatedAt = updatedAt;

  ChatMessageRecordDtoGenerationStatusEnum? _generationStatus;
  ChatMessageRecordDtoGenerationStatusEnum? get generationStatus =>
      _$this._generationStatus;
  set generationStatus(
          ChatMessageRecordDtoGenerationStatusEnum? generationStatus) =>
      _$this._generationStatus = generationStatus;

  ChatMessageRecordDtoGenerationPhaseEnum? _generationPhase;
  ChatMessageRecordDtoGenerationPhaseEnum? get generationPhase =>
      _$this._generationPhase;
  set generationPhase(
          ChatMessageRecordDtoGenerationPhaseEnum? generationPhase) =>
      _$this._generationPhase = generationPhase;

  String? _errorCode;
  String? get errorCode => _$this._errorCode;
  set errorCode(String? errorCode) => _$this._errorCode = errorCode;

  ChatMessageRecordDtoBuilder() {
    ChatMessageRecordDto._defaults(this);
  }

  ChatMessageRecordDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _role = $v.role;
      _content = $v.content;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _generationStatus = $v.generationStatus;
      _generationPhase = $v.generationPhase;
      _errorCode = $v.errorCode;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ChatMessageRecordDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ChatMessageRecordDto;
  }

  @override
  void update(void Function(ChatMessageRecordDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ChatMessageRecordDto build() => _build();

  _$ChatMessageRecordDto _build() {
    final _$result = _$v ??
        new _$ChatMessageRecordDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'ChatMessageRecordDto', 'id'),
            role: BuiltValueNullFieldError.checkNotNull(
                role, r'ChatMessageRecordDto', 'role'),
            content: BuiltValueNullFieldError.checkNotNull(
                content, r'ChatMessageRecordDto', 'content'),
            createdAt: BuiltValueNullFieldError.checkNotNull(
                createdAt, r'ChatMessageRecordDto', 'createdAt'),
            updatedAt: updatedAt,
            generationStatus: generationStatus,
            generationPhase: generationPhase,
            errorCode: errorCode);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
