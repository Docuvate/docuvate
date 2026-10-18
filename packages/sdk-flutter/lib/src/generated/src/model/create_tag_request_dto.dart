//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_tag_request_dto.g.dart';

/// CreateTagRequestDto
///
/// Properties:
/// * [name] 
/// * [color] 
/// * [isInbox] 
/// * [matchingAlgorithm] 
/// * [match] 
@BuiltValue()
abstract class CreateTagRequestDto implements Built<CreateTagRequestDto, CreateTagRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'color')
  String? get color;

  @BuiltValueField(wireName: r'isInbox')
  bool? get isInbox;

  @BuiltValueField(wireName: r'matchingAlgorithm')
  CreateTagRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm;
  // enum matchingAlgorithmEnum {  none,  any,  all,  exact,  regex,  };

  @BuiltValueField(wireName: r'match')
  String? get match;

  CreateTagRequestDto._();

  factory CreateTagRequestDto([void updates(CreateTagRequestDtoBuilder b)]) = _$CreateTagRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateTagRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateTagRequestDto> get serializer => _$CreateTagRequestDtoSerializer();
}

class _$CreateTagRequestDtoSerializer implements PrimitiveSerializer<CreateTagRequestDto> {
  @override
  final Iterable<Type> types = const [CreateTagRequestDto, _$CreateTagRequestDto];

  @override
  final String wireName = r'CreateTagRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateTagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.color != null) {
      yield r'color';
      yield serializers.serialize(
        object.color,
        specifiedType: const FullType(String),
      );
    }
    if (object.isInbox != null) {
      yield r'isInbox';
      yield serializers.serialize(
        object.isInbox,
        specifiedType: const FullType(bool),
      );
    }
    if (object.matchingAlgorithm != null) {
      yield r'matchingAlgorithm';
      yield serializers.serialize(
        object.matchingAlgorithm,
        specifiedType: const FullType(CreateTagRequestDtoMatchingAlgorithmEnum),
      );
    }
    if (object.match != null) {
      yield r'match';
      yield serializers.serialize(
        object.match,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    CreateTagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateTagRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'color':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.color = valueDes;
          break;
        case r'isInbox':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.isInbox = valueDes;
          break;
        case r'matchingAlgorithm':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(CreateTagRequestDtoMatchingAlgorithmEnum),
          ) as CreateTagRequestDtoMatchingAlgorithmEnum;
          result.matchingAlgorithm = valueDes;
          break;
        case r'match':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.match = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  CreateTagRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateTagRequestDtoBuilder();
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

class CreateTagRequestDtoMatchingAlgorithmEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'none')
  static const CreateTagRequestDtoMatchingAlgorithmEnum none = _$createTagRequestDtoMatchingAlgorithmEnum_none;
  @BuiltValueEnumConst(wireName: r'any')
  static const CreateTagRequestDtoMatchingAlgorithmEnum any = _$createTagRequestDtoMatchingAlgorithmEnum_any;
  @BuiltValueEnumConst(wireName: r'all')
  static const CreateTagRequestDtoMatchingAlgorithmEnum all = _$createTagRequestDtoMatchingAlgorithmEnum_all;
  @BuiltValueEnumConst(wireName: r'exact')
  static const CreateTagRequestDtoMatchingAlgorithmEnum exact = _$createTagRequestDtoMatchingAlgorithmEnum_exact;
  @BuiltValueEnumConst(wireName: r'regex')
  static const CreateTagRequestDtoMatchingAlgorithmEnum regex = _$createTagRequestDtoMatchingAlgorithmEnum_regex;

  static Serializer<CreateTagRequestDtoMatchingAlgorithmEnum> get serializer => _$createTagRequestDtoMatchingAlgorithmEnumSerializer;

  const CreateTagRequestDtoMatchingAlgorithmEnum._(String name): super(name);

  static BuiltSet<CreateTagRequestDtoMatchingAlgorithmEnum> get values => _$createTagRequestDtoMatchingAlgorithmEnumValues;
  static CreateTagRequestDtoMatchingAlgorithmEnum valueOf(String name) => _$createTagRequestDtoMatchingAlgorithmEnumValueOf(name);
}

