//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/layout_compare_page_metric_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_compare_metrics_response_dto.g.dart';

/// LayoutCompareMetricsResponseDto
///
/// Properties:
/// * [category] 
/// * [ssimFloor] 
/// * [pageCount] 
/// * [pages] 
@BuiltValue()
abstract class LayoutCompareMetricsResponseDto implements Built<LayoutCompareMetricsResponseDto, LayoutCompareMetricsResponseDtoBuilder> {
  @BuiltValueField(wireName: r'category')
  String get category;

  @BuiltValueField(wireName: r'ssimFloor')
  num get ssimFloor;

  @BuiltValueField(wireName: r'pageCount')
  num get pageCount;

  @BuiltValueField(wireName: r'pages')
  BuiltList<LayoutComparePageMetricDto> get pages;

  LayoutCompareMetricsResponseDto._();

  factory LayoutCompareMetricsResponseDto([void updates(LayoutCompareMetricsResponseDtoBuilder b)]) = _$LayoutCompareMetricsResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutCompareMetricsResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutCompareMetricsResponseDto> get serializer => _$LayoutCompareMetricsResponseDtoSerializer();
}

class _$LayoutCompareMetricsResponseDtoSerializer implements PrimitiveSerializer<LayoutCompareMetricsResponseDto> {
  @override
  final Iterable<Type> types = const [LayoutCompareMetricsResponseDto, _$LayoutCompareMetricsResponseDto];

  @override
  final String wireName = r'LayoutCompareMetricsResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutCompareMetricsResponseDto object, {
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
    yield r'pages';
    yield serializers.serialize(
      object.pages,
      specifiedType: const FullType(BuiltList, [FullType(LayoutComparePageMetricDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutCompareMetricsResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutCompareMetricsResponseDtoBuilder result,
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
        case r'pages':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LayoutComparePageMetricDto)]),
          ) as BuiltList<LayoutComparePageMetricDto>;
          result.pages.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutCompareMetricsResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutCompareMetricsResponseDtoBuilder();
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

