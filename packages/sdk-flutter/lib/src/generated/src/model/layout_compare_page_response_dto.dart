//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_compare_page_response_dto.g.dart';

/// LayoutComparePageResponseDto
///
/// Properties:
/// * [pageNumber] 
/// * [ssim] 
/// * [inkDeviation] 
/// * [ssimFloor] 
/// * [pageReliable] 
/// * [widthPx] 
/// * [heightPx] 
/// * [originalPngBase64] 
/// * [reconstructionPngBase64] 
/// * [heatmapPngBase64] 
/// * [error] 
@BuiltValue()
abstract class LayoutComparePageResponseDto implements Built<LayoutComparePageResponseDto, LayoutComparePageResponseDtoBuilder> {
  @BuiltValueField(wireName: r'pageNumber')
  num get pageNumber;

  @BuiltValueField(wireName: r'ssim')
  num get ssim;

  @BuiltValueField(wireName: r'inkDeviation')
  num get inkDeviation;

  @BuiltValueField(wireName: r'ssimFloor')
  num get ssimFloor;

  @BuiltValueField(wireName: r'pageReliable')
  bool get pageReliable;

  @BuiltValueField(wireName: r'widthPx')
  num get widthPx;

  @BuiltValueField(wireName: r'heightPx')
  num get heightPx;

  @BuiltValueField(wireName: r'originalPngBase64')
  String get originalPngBase64;

  @BuiltValueField(wireName: r'reconstructionPngBase64')
  String get reconstructionPngBase64;

  @BuiltValueField(wireName: r'heatmapPngBase64')
  String? get heatmapPngBase64;

  @BuiltValueField(wireName: r'error')
  String? get error;

  LayoutComparePageResponseDto._();

  factory LayoutComparePageResponseDto([void updates(LayoutComparePageResponseDtoBuilder b)]) = _$LayoutComparePageResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutComparePageResponseDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutComparePageResponseDto> get serializer => _$LayoutComparePageResponseDtoSerializer();
}

class _$LayoutComparePageResponseDtoSerializer implements PrimitiveSerializer<LayoutComparePageResponseDto> {
  @override
  final Iterable<Type> types = const [LayoutComparePageResponseDto, _$LayoutComparePageResponseDto];

  @override
  final String wireName = r'LayoutComparePageResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutComparePageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'pageNumber';
    yield serializers.serialize(
      object.pageNumber,
      specifiedType: const FullType(num),
    );
    yield r'ssim';
    yield serializers.serialize(
      object.ssim,
      specifiedType: const FullType(num),
    );
    yield r'inkDeviation';
    yield serializers.serialize(
      object.inkDeviation,
      specifiedType: const FullType(num),
    );
    yield r'ssimFloor';
    yield serializers.serialize(
      object.ssimFloor,
      specifiedType: const FullType(num),
    );
    yield r'pageReliable';
    yield serializers.serialize(
      object.pageReliable,
      specifiedType: const FullType(bool),
    );
    yield r'widthPx';
    yield serializers.serialize(
      object.widthPx,
      specifiedType: const FullType(num),
    );
    yield r'heightPx';
    yield serializers.serialize(
      object.heightPx,
      specifiedType: const FullType(num),
    );
    yield r'originalPngBase64';
    yield serializers.serialize(
      object.originalPngBase64,
      specifiedType: const FullType(String),
    );
    yield r'reconstructionPngBase64';
    yield serializers.serialize(
      object.reconstructionPngBase64,
      specifiedType: const FullType(String),
    );
    if (object.heatmapPngBase64 != null) {
      yield r'heatmapPngBase64';
      yield serializers.serialize(
        object.heatmapPngBase64,
        specifiedType: const FullType(String),
      );
    }
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
    LayoutComparePageResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutComparePageResponseDtoBuilder result,
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
        case r'ssimFloor':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.ssimFloor = valueDes;
          break;
        case r'pageReliable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.pageReliable = valueDes;
          break;
        case r'widthPx':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.widthPx = valueDes;
          break;
        case r'heightPx':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.heightPx = valueDes;
          break;
        case r'originalPngBase64':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.originalPngBase64 = valueDes;
          break;
        case r'reconstructionPngBase64':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.reconstructionPngBase64 = valueDes;
          break;
        case r'heatmapPngBase64':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.heatmapPngBase64 = valueDes;
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
  LayoutComparePageResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutComparePageResponseDtoBuilder();
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

