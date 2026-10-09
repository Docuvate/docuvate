//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_typst_response_dto.g.dart';

/// LayoutTypstResponseDto
///
/// Properties:
/// * [typst] 
@BuiltValue()
abstract class LayoutTypstResponseDto implements Built<LayoutTypstResponseDto, LayoutTypstResponseDtoBuilder> {
  @BuiltValueField(wireName: r'typst')
  String get typst;

  LayoutTypstResponseDto._();

  factory LayoutTypstResponseDto([void updates(LayoutTypstResponseDtoBuilder b)]) = _$LayoutTypstResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutTypstResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutTypstResponseDto> get serializer => _$LayoutTypstResponseDtoSerializer();
}

class _$LayoutTypstResponseDtoSerializer implements PrimitiveSerializer<LayoutTypstResponseDto> {
  @override
  final Iterable<Type> types = const [LayoutTypstResponseDto, _$LayoutTypstResponseDto];

  @override
  final String wireName = r'LayoutTypstResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutTypstResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'typst';
    yield serializers.serialize(
      object.typst,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutTypstResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutTypstResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'typst':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.typst = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutTypstResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutTypstResponseDtoBuilder();
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

