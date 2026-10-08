// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_message_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ChatMessageDtoRoleEnum _$chatMessageDtoRoleEnum_user =
    const ChatMessageDtoRoleEnum._('user');
const ChatMessageDtoRoleEnum _$chatMessageDtoRoleEnum_assistant =
    const ChatMessageDtoRoleEnum._('assistant');

ChatMessageDtoRoleEnum _$chatMessageDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'user':
      return _$chatMessageDtoRoleEnum_user;
    case 'assistant':
      return _$chatMessageDtoRoleEnum_assistant;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ChatMessageDtoRoleEnum> _$chatMessageDtoRoleEnumValues =
    new BuiltSet<ChatMessageDtoRoleEnum>(const <ChatMessageDtoRoleEnum>[
  _$chatMessageDtoRoleEnum_user,
  _$chatMessageDtoRoleEnum_assistant,
]);

Serializer<ChatMessageDtoRoleEnum> _$chatMessageDtoRoleEnumSerializer =
    new _$ChatMessageDtoRoleEnumSerializer();

class _$ChatMessageDtoRoleEnumSerializer
    implements PrimitiveSerializer<ChatMessageDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'user': 'user',
    'assistant': 'assistant',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'user': 'user',
    'assistant': 'assistant',
  };

  @override
  final Iterable<Type> types = const <Type>[ChatMessageDtoRoleEnum];
  @override
  final String wireName = 'ChatMessageDtoRoleEnum';

  @override
  Object serialize(Serializers serializers, ChatMessageDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ChatMessageDtoRoleEnum deserialize(Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ChatMessageDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ChatMessageDto extends ChatMessageDto {
  @override
  final ChatMessageDtoRoleEnum role;
  @override
  final String content;

  factory _$ChatMessageDto([void Function(ChatMessageDtoBuilder)? updates]) =>
      (new ChatMessageDtoBuilder()..update(updates))._build();

  _$ChatMessageDto._({required this.role, required this.content}) : super._() {
    BuiltValueNullFieldError.checkNotNull(role, r'ChatMessageDto', 'role');
    BuiltValueNullFieldError.checkNotNull(
        content, r'ChatMessageDto', 'content');
  }

  @override
  ChatMessageDto rebuild(void Function(ChatMessageDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ChatMessageDtoBuilder toBuilder() =>
      new ChatMessageDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ChatMessageDto &&
        role == other.role &&
        content == other.content;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, content.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ChatMessageDto')
          ..add('role', role)
          ..add('content', content))
        .toString();
  }
}

class ChatMessageDtoBuilder
    implements Builder<ChatMessageDto, ChatMessageDtoBuilder> {
  _$ChatMessageDto? _$v;

  ChatMessageDtoRoleEnum? _role;
  ChatMessageDtoRoleEnum? get role => _$this._role;
  set role(ChatMessageDtoRoleEnum? role) => _$this._role = role;

  String? _content;
  String? get content => _$this._content;
  set content(String? content) => _$this._content = content;

  ChatMessageDtoBuilder() {
    ChatMessageDto._defaults(this);
  }

  ChatMessageDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _content = $v.content;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ChatMessageDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ChatMessageDto;
  }

  @override
  void update(void Function(ChatMessageDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ChatMessageDto build() => _build();

  _$ChatMessageDto _build() {
    final _$result = _$v ??
        new _$ChatMessageDto._(
            role: BuiltValueNullFieldError.checkNotNull(
                role, r'ChatMessageDto', 'role'),
            content: BuiltValueNullFieldError.checkNotNull(
                content, r'ChatMessageDto', 'content'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
