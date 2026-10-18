//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'create_correspondent_request_dto.g.dart';

/// CreateCorrespondentRequestDto
///
/// Properties:
/// * [name] 
/// * [matchingAlgorithm] 
/// * [match] 
@BuiltValue()
abstract class CreateCorrespondentRequestDto implements Built<CreateCorrespondentRequestDto, CreateCorrespondentRequestDtoBuilder> {
  @BuiltValueField(wireName: r'name')
  String get name;

  @BuiltValueField(wireName: r'matchingAlgorithm')
  CreateCorrespondentRequestDtoMatchingAlgorithmEnum? get matchingAlgorithm;
  // enum matchingAlgorithmEnum {  none,  any,  all,  exact,  regex,  };

  @BuiltValueField(wireName: r'match')
  String? get match;

  CreateCorrespondentRequestDto._();

  factory CreateCorrespondentRequestDto([void updates(CreateCorrespondentRequestDtoBuilder b)]) = _$CreateCorrespondentRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(CreateCorrespondentRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<CreateCorrespondentRequestDto> get serializer => _$CreateCorrespondentRequestDtoSerializer();
}

class _$CreateCorrespondentRequestDtoSerializer implements PrimitiveSerializer<CreateCorrespondentRequestDto> {
  @override
  final Iterable<Type> types = const [CreateCorrespondentRequestDto, _$CreateCorrespondentRequestDto];

  @override
  final String wireName = r'CreateCorrespondentRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    CreateCorrespondentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'name';
    yield serializers.serialize(
      object.name,
      specifiedType: const FullType(String),
    );
    if (object.matchingAlgorithm != null) {
      yield r'matchingAlgorithm';
      yield serializers.serialize(
        object.matchingAlgorithm,
        specifiedType: const FullType(CreateCorrespondentRequestDtoMatchingAlgorithmEnum),
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
    CreateCorrespondentRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required CreateCorrespondentRequestDtoBuilder result,
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
            specifiedType: const FullType(CreateCorrespondentRequestDtoMatchingAlgorithmEnum),
          ) as CreateCorrespondentRequestDtoMatchingAlgorithmEnum;
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
  CreateCorrespondentRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = CreateCorrespondentRequestDtoBuilder();
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

class CreateCorrespondentRequestDtoMatchingAlgorithmEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'none')
  static const CreateCorrespondentRequestDtoMatchingAlgorithmEnum none = _$createCorrespondentRequestDtoMatchingAlgorithmEnum_none;
  @BuiltValueEnumConst(wireName: r'any')
  static const CreateCorrespondentRequestDtoMatchingAlgorithmEnum any = _$createCorrespondentRequestDtoMatchingAlgorithmEnum_any;
  @BuiltValueEnumConst(wireName: r'all')
  static const CreateCorrespondentRequestDtoMatchingAlgorithmEnum all = _$createCorrespondentRequestDtoMatchingAlgorithmEnum_all;
  @BuiltValueEnumConst(wireName: r'exact')
  static const CreateCorrespondentRequestDtoMatchingAlgorithmEnum exact = _$createCorrespondentRequestDtoMatchingAlgorithmEnum_exact;
  @BuiltValueEnumConst(wireName: r'regex')
  static const CreateCorrespondentRequestDtoMatchingAlgorithmEnum regex = _$createCorrespondentRequestDtoMatchingAlgorithmEnum_regex;

  static Serializer<CreateCorrespondentRequestDtoMatchingAlgorithmEnum> get serializer => _$createCorrespondentRequestDtoMatchingAlgorithmEnumSerializer;

  const CreateCorrespondentRequestDtoMatchingAlgorithmEnum._(String name): super(name);

  static BuiltSet<CreateCorrespondentRequestDtoMatchingAlgorithmEnum> get values => _$createCorrespondentRequestDtoMatchingAlgorithmEnumValues;
  static CreateCorrespondentRequestDtoMatchingAlgorithmEnum valueOf(String name) => _$createCorrespondentRequestDtoMatchingAlgorithmEnumValueOf(name);
}

