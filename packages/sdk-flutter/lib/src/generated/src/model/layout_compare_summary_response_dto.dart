//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_compare_summary_response_dto.g.dart';

/// LayoutCompareSummaryResponseDto
///
/// Properties:
/// * [category] 
/// * [ssimFloor] 
/// * [pageCount] 
@BuiltValue()
abstract class LayoutCompareSummaryResponseDto implements Built<LayoutCompareSummaryResponseDto, LayoutCompareSummaryResponseDtoBuilder> {
  @BuiltValueField(wireName: r'category')
  String get category;

  @BuiltValueField(wireName: r'ssimFloor')
  num get ssimFloor;

  @BuiltValueField(wireName: r'pageCount')
  num get pageCount;

  LayoutCompareSummaryResponseDto._();

  factory LayoutCompareSummaryResponseDto([void updates(LayoutCompareSummaryResponseDtoBuilder b)]) = _$LayoutCompareSummaryResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutCompareSummaryResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutCompareSummaryResponseDto> get serializer => _$LayoutCompareSummaryResponseDtoSerializer();
}

class _$LayoutCompareSummaryResponseDtoSerializer implements PrimitiveSerializer<LayoutCompareSummaryResponseDto> {
  @override
  final Iterable<Type> types = const [LayoutCompareSummaryResponseDto, _$LayoutCompareSummaryResponseDto];

  @override
  final String wireName = r'LayoutCompareSummaryResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutCompareSummaryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'category';
    yield serializers.serialize(
      object.category,
      specifiedType: const FullType(String),
    );
    yield r'ssimFloor';
    yield serializers.serialize(
      object.ssimFloor,
      specifiedType: const FullType(num),
    );
    yield r'pageCount';
    yield serializers.serialize(
      object.pageCount,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutCompareSummaryResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutCompareSummaryResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'category':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.category = valueDes;
          break;
        case r'ssimFloor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.ssimFloor = valueDes;
          break;
        case r'pageCount':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.pageCount = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutCompareSummaryResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutCompareSummaryResponseDtoBuilder();
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

