//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_tag_request_dto.g.dart';

/// UpdateTagRequestDto
///
/// Properties:
/// * [name] 
/// * [color] 
/// * [isInbox] 
/// * [matchingAlgorithm] 
/// * [match] 
@BuiltValue()
abstract class UpdateTagRequestDto implements Built<UpdateTagRequestDto, UpdateTagRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'color')
  String? get color;

  @BuiltValueField(wireName: r'isInbox')
  bool? get isInbox;

  @BuiltValueField(wireName: r'matchingAlgorithm')
  UpdateTagRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm;
  // enum matchingAlgorithmEnum {  none,  any,  all,  exact,  regex,  };

  @BuiltValueField(wireName: r'match')
  String? get match;

  UpdateTagRequestDto._();

  factory UpdateTagRequestDto([void updates(UpdateTagRequestDtoBuilder b)]) = _$UpdateTagRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateTagRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateTagRequestDto> get serializer => _$UpdateTagRequestDtoSerializer();
}

class _$UpdateTagRequestDtoSerializer implements PrimitiveSerializer<UpdateTagRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateTagRequestDto, _$UpdateTagRequestDto];

  @override
  final String wireName = r'UpdateTagRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateTagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
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
        specifiedType: const FullType(UpdateTagRequestDtoMatchingAlgorithmEnum),
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
    UpdateTagRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateTagRequestDtoBuilder result,
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
            specifiedType: const FullType(UpdateTagRequestDtoMatchingAlgorithmEnum),
          ) as UpdateTagRequestDtoMatchingAlgorithmEnum;
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
  UpdateTagRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateTagRequestDtoBuilder();
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

class UpdateTagRequestDtoMatchingAlgorithmEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'none')
  static const UpdateTagRequestDtoMatchingAlgorithmEnum none = _$updateTagRequestDtoMatchingAlgorithmEnum_none;
  @BuiltValueEnumConst(wireName: r'any')
  static const UpdateTagRequestDtoMatchingAlgorithmEnum any = _$updateTagRequestDtoMatchingAlgorithmEnum_any;
  @BuiltValueEnumConst(wireName: r'all')
  static const UpdateTagRequestDtoMatchingAlgorithmEnum all = _$updateTagRequestDtoMatchingAlgorithmEnum_all;
  @BuiltValueEnumConst(wireName: r'exact')
  static const UpdateTagRequestDtoMatchingAlgorithmEnum exact = _$updateTagRequestDtoMatchingAlgorithmEnum_exact;
  @BuiltValueEnumConst(wireName: r'regex')
  static const UpdateTagRequestDtoMatchingAlgorithmEnum regex = _$updateTagRequestDtoMatchingAlgorithmEnum_regex;

  static Serializer<UpdateTagRequestDtoMatchingAlgorithmEnum> get serializer => _$updateTagRequestDtoMatchingAlgorithmEnumSerializer;

  const UpdateTagRequestDtoMatchingAlgorithmEnum._(String name): super(name);

  static BuiltSet<UpdateTagRequestDtoMatchingAlgorithmEnum> get values => _$updateTagRequestDtoMatchingAlgorithmEnumValues;
  static UpdateTagRequestDtoMatchingAlgorithmEnum valueOf(String name) => _$updateTagRequestDtoMatchingAlgorithmEnumValueOf(name);
}

