//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_correspondent_request_dto.g.dart';

/// UpdateCorrespondentRequestDto
///
/// Properties:
/// * [name] 
/// * [matchingAlgorithm] 
/// * [match] 
@BuiltValue()
abstract class UpdateCorrespondentRequestDto implements Built<UpdateCorrespondentRequestDto, UpdateCorrespondentRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'matchingAlgorithm')
  UpdateCorrespondentRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm;
  // enum matchingAlgorithmEnum {  none,  any,  all,  exact,  regex,  };

  @BuiltValueField(wireName: r'match')
  String? get match;

  UpdateCorrespondentRequestDto._();

  factory UpdateCorrespondentRequestDto([void updates(UpdateCorrespondentRequestDtoBuilder b)]) = _$UpdateCorrespondentRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateCorrespondentRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateCorrespondentRequestDto> get serializer => _$UpdateCorrespondentRequestDtoSerializer();
}

class _$UpdateCorrespondentRequestDtoSerializer implements PrimitiveSerializer<UpdateCorrespondentRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateCorrespondentRequestDto, _$UpdateCorrespondentRequestDto];

  @override
  final String wireName = r'UpdateCorrespondentRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateCorrespondentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    if (object.matchingAlgorithm != null) {
      yield r'matchingAlgorithm';
      yield serializers.serialize(
        object.matchingAlgorithm,
        specifiedType: const FullType(UpdateCorrespondentRequestDtoMatchingAlgorithmEnum),
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
    UpdateCorrespondentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateCorrespondentRequestDtoBuilder result,
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
        case r'matchingAlgorithm':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateCorrespondentRequestDtoMatchingAlgorithmEnum),
          ) as UpdateCorrespondentRequestDtoMatchingAlgorithmEnum;
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
  UpdateCorrespondentRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateCorrespondentRequestDtoBuilder();
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

class UpdateCorrespondentRequestDtoMatchingAlgorithmEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'none')
  static const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum none = _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_none;
  @BuiltValueEnumConst(wireName: r'any')
  static const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum any = _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_any;
  @BuiltValueEnumConst(wireName: r'all')
  static const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum all = _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_all;
  @BuiltValueEnumConst(wireName: r'exact')
  static const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum exact = _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_exact;
  @BuiltValueEnumConst(wireName: r'regex')
  static const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum regex = _$updateCorrespondentRequestDtoMatchingAlgorithmEnum_regex;

  static Serializer<UpdateCorrespondentRequestDtoMatchingAlgorithmEnum> get serializer => _$updateCorrespondentRequestDtoMatchingAlgorithmEnumSerializer;

  const UpdateCorrespondentRequestDtoMatchingAlgorithmEnum._(String name): super(name);

  static BuiltSet<UpdateCorrespondentRequestDtoMatchingAlgorithmEnum> get values => _$updateCorrespondentRequestDtoMatchingAlgorithmEnumValues;
  static UpdateCorrespondentRequestDtoMatchingAlgorithmEnum valueOf(String name) => _$updateCorrespondentRequestDtoMatchingAlgorithmEnumValueOf(name);
}

