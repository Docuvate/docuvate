//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/ml_model_version_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'ml_model_version_list_response_dto.g.dart';

/// MlModelVersionListResponseDto
///
/// Properties:
/// * [versions] 
@BuiltValue()
abstract class MlModelVersionListResponseDto implements Built<MlModelVersionListResponseDto, MlModelVersionListResponseDtoBuilder> {
  @BuiltValueField(wireName: r'versions')
  BuiltList<MlModelVersionDto> get versions;

  MlModelVersionListResponseDto._();

  factory MlModelVersionListResponseDto([void updates(MlModelVersionListResponseDtoBuilder b)]) = _$MlModelVersionListResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MlModelVersionListResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MlModelVersionListResponseDto> get serializer => _$MlModelVersionListResponseDtoSerializer();
}

class _$MlModelVersionListResponseDtoSerializer implements PrimitiveSerializer<MlModelVersionListResponseDto> {
  @override
  final Iterable<Type> types = const [MlModelVersionListResponseDto, _$MlModelVersionListResponseDto];

  @override
  final String wireName = r'MlModelVersionListResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MlModelVersionListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'versions';
    yield serializers.serialize(
      object.versions,
      specifiedType: const FullType(BuiltList, [FullType(MlModelVersionDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    MlModelVersionListResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MlModelVersionListResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'versions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(MlModelVersionDto)]),
          ) as BuiltList<MlModelVersionDto>;
          result.versions.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MlModelVersionListResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MlModelVersionListResponseDtoBuilder();
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

