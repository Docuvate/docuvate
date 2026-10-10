//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_compare_page_metric_dto.g.dart';

/// LayoutComparePageMetricDto
///
/// Properties:
/// * [pageNumber] 
/// * [ssim] 
/// * [inkDeviation] 
/// * [pageReliable] 
/// * [error] 
@BuiltValue()
abstract class LayoutComparePageMetricDto implements Built<LayoutComparePageMetricDto, LayoutComparePageMetricDtoBuilder> {
  @BuiltValueField(wireName: r'pageNumber')
  num get pageNumber;

  @BuiltValueField(wireName: r'ssim')
  num? get ssim;

  @BuiltValueField(wireName: r'inkDeviation')
  num? get inkDeviation;

  @BuiltValueField(wireName: r'pageReliable')
  bool get pageReliable;

  @BuiltValueField(wireName: r'error')
  String? get error;

  LayoutComparePageMetricDto._();

  factory LayoutComparePageMetricDto([void updates(LayoutComparePageMetricDtoBuilder b)]) = _$LayoutComparePageMetricDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutComparePageMetricDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutComparePageMetricDto> get serializer => _$LayoutComparePageMetricDtoSerializer();
}

class _$LayoutComparePageMetricDtoSerializer implements PrimitiveSerializer<LayoutComparePageMetricDto> {
  @override
  final Iterable<Type> types = const [LayoutComparePageMetricDto, _$LayoutComparePageMetricDto];

  @override
  final String wireName = r'LayoutComparePageMetricDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutComparePageMetricDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'pageNumber';
    yield serializers.serialize(
      object.pageNumber,
      specifiedType: const FullType(num),
    );
    if (object.ssim != null) {
      yield r'ssim';
      yield serializers.serialize(
        object.ssim,
        specifiedType: const FullType(num),
      );
    }
    if (object.inkDeviation != null) {
      yield r'inkDeviation';
      yield serializers.serialize(
        object.inkDeviation,
        specifiedType: const FullType(num),
      );
    }
    yield r'pageReliable';
    yield serializers.serialize(
      object.pageReliable,
      specifiedType: const FullType(bool),
    );
    if (object.error != null) {
      yield r'error';
      yield serializers.serialize(
        object.error,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutComparePageMetricDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutComparePageMetricDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'pageNumber':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.pageNumber = valueDes;
          break;
        case r'ssim':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.ssim = valueDes;
          break;
        case r'inkDeviation':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.inkDeviation = valueDes;
          break;
        case r'pageReliable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.pageReliable = valueDes;
          break;
        case r'error':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.error = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutComparePageMetricDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutComparePageMetricDtoBuilder();
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

