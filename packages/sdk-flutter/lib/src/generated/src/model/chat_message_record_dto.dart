//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'chat_message_record_dto.g.dart';

/// ChatMessageRecordDto
///
/// Properties:
/// * [id] 
/// * [role] 
/// * [content] 
/// * [createdAt] 
/// * [updatedAt] 
/// * [generationStatus] 
/// * [generationPhase] 
/// * [errorCode] 
@BuiltValue()
abstract class ChatMessageRecordDto implements Built<ChatMessageRecordDto, ChatMessageRecordDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'role')
  ChatMessageRecordDtoRoleEnum get role;
  // enum roleEnum {  user,  assistant,  };

  @BuiltValueField(wireName: r'content')
  String get content;

  @BuiltValueField(wireName: r'createdAt')
  String get createdAt;

  @BuiltValueField(wireName: r'updatedAt')
  String? get updatedAt;

  @BuiltValueField(wireName: r'generationStatus')
  ChatMessageRecordDtoGenerationStatusEnum? get generationStatus;
  // enum generationStatusEnum {  failed,  pending,  streaming,  done,  };

  @BuiltValueField(wireName: r'generationPhase')
  ChatMessageRecordDtoGenerationPhaseEnum? get generationPhase;
  // enum generationPhaseEnum {  retrieving,  generating,  };

  @BuiltValueField(wireName: r'errorCode')
  String? get errorCode;

  ChatMessageRecordDto._();

  factory ChatMessageRecordDto([void updates(ChatMessageRecordDtoBuilder b)]) = _$ChatMessageRecordDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ChatMessageRecordDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ChatMessageRecordDto> get serializer => _$ChatMessageRecordDtoSerializer();
}

class _$ChatMessageRecordDtoSerializer implements PrimitiveSerializer<ChatMessageRecordDto> {
  @override
  final Iterable<Type> types = const [ChatMessageRecordDto, _$ChatMessageRecordDto];

  @override
  final String wireName = r'ChatMessageRecordDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ChatMessageRecordDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'role';
    yield serializers.serialize(
      object.role,
      specifiedType: const FullType(ChatMessageRecordDtoRoleEnum),
    );
    yield r'content';
    yield serializers.serialize(
      object.content,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(String),
    );
    if (object.updatedAt != null) {
      yield r'updatedAt';
      yield serializers.serialize(
        object.updatedAt,
        specifiedType: const FullType(String),
      );
    }
    if (object.generationStatus != null) {
      yield r'generationStatus';
      yield serializers.serialize(
        object.generationStatus,
        specifiedType: const FullType(ChatMessageRecordDtoGenerationStatusEnum),
      );
    }
    if (object.generationPhase != null) {
      yield r'generationPhase';
      yield serializers.serialize(
        object.generationPhase,
        specifiedType: const FullType(ChatMessageRecordDtoGenerationPhaseEnum),
      );
    }
    if (object.errorCode != null) {
      yield r'errorCode';
      yield serializers.serialize(
        object.errorCode,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ChatMessageRecordDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ChatMessageRecordDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageRecordDtoRoleEnum),
          ) as ChatMessageRecordDtoRoleEnum;
          result.role = valueDes;
          break;
        case r'content':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.content = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.createdAt = valueDes;
          break;
        case r'updatedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.updatedAt = valueDes;
          break;
        case r'generationStatus':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageRecordDtoGenerationStatusEnum),
          ) as ChatMessageRecordDtoGenerationStatusEnum;
          result.generationStatus = valueDes;
          break;
        case r'generationPhase':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(ChatMessageRecordDtoGenerationPhaseEnum),
          ) as ChatMessageRecordDtoGenerationPhaseEnum;
          result.generationPhase = valueDes;
          break;
        case r'errorCode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.errorCode = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ChatMessageRecordDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ChatMessageRecordDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class ChatMessageRecordDtoRoleEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'user')
  static const ChatMessageRecordDtoRoleEnum user = _$chatMessageRecordDtoRoleEnum_user;
  @BuiltValueEnumConst(wireName: r'assistant')
  static const ChatMessageRecordDtoRoleEnum assistant = _$chatMessageRecordDtoRoleEnum_assistant;

  static Serializer<ChatMessageRecordDtoRoleEnum> get serializer => _$chatMessageRecordDtoRoleEnumSerializer;

  const ChatMessageRecordDtoRoleEnum._(String name): super(name);

  static BuiltSet<ChatMessageRecordDtoRoleEnum> get values => _$chatMessageRecordDtoRoleEnumValues;
  static ChatMessageRecordDtoRoleEnum valueOf(String name) => _$chatMessageRecordDtoRoleEnumValueOf(name);
}

class ChatMessageRecordDtoGenerationStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'failed')
  static const ChatMessageRecordDtoGenerationStatusEnum failed = _$chatMessageRecordDtoGenerationStatusEnum_failed;
  @BuiltValueEnumConst(wireName: r'pending')
  static const ChatMessageRecordDtoGenerationStatusEnum pending = _$chatMessageRecordDtoGenerationStatusEnum_pending;
  @BuiltValueEnumConst(wireName: r'streaming')
  static const ChatMessageRecordDtoGenerationStatusEnum streaming = _$chatMessageRecordDtoGenerationStatusEnum_streaming;
  @BuiltValueEnumConst(wireName: r'done')
  static const ChatMessageRecordDtoGenerationStatusEnum done = _$chatMessageRecordDtoGenerationStatusEnum_done;

  static Serializer<ChatMessageRecordDtoGenerationStatusEnum> get serializer => _$chatMessageRecordDtoGenerationStatusEnumSerializer;

  const ChatMessageRecordDtoGenerationStatusEnum._(String name): super(name);

  static BuiltSet<ChatMessageRecordDtoGenerationStatusEnum> get values => _$chatMessageRecordDtoGenerationStatusEnumValues;
  static ChatMessageRecordDtoGenerationStatusEnum valueOf(String name) => _$chatMessageRecordDtoGenerationStatusEnumValueOf(name);
}

class ChatMessageRecordDtoGenerationPhaseEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'retrieving')
  static const ChatMessageRecordDtoGenerationPhaseEnum retrieving = _$chatMessageRecordDtoGenerationPhaseEnum_retrieving;
  @BuiltValueEnumConst(wireName: r'generating')
  static const ChatMessageRecordDtoGenerationPhaseEnum generating = _$chatMessageRecordDtoGenerationPhaseEnum_generating;

  static Serializer<ChatMessageRecordDtoGenerationPhaseEnum> get serializer => _$chatMessageRecordDtoGenerationPhaseEnumSerializer;

  const ChatMessageRecordDtoGenerationPhaseEnum._(String name): super(name);

  static BuiltSet<ChatMessageRecordDtoGenerationPhaseEnum> get values => _$chatMessageRecordDtoGenerationPhaseEnumValues;
  static ChatMessageRecordDtoGenerationPhaseEnum valueOf(String name) => _$chatMessageRecordDtoGenerationPhaseEnumValueOf(name);
}

