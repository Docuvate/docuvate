//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'layout_html_response_dto.g.dart';

/// LayoutHtmlResponseDto
///
/// Properties:
/// * [html] 
/// * [reconstructionReliable] 
/// * [unreliableReason] 
@BuiltValue()
abstract class LayoutHtmlResponseDto implements Built<LayoutHtmlResponseDto, LayoutHtmlResponseDtoBuilder> {
  @BuiltValueField(wireName: r'html')
  String get html;

  @BuiltValueField(wireName: r'reconstructionReliable')
  bool get reconstructionReliable;

  @BuiltValueField(wireName: r'unreliableReason')
  String? get unreliableReason;

  LayoutHtmlResponseDto._();

  factory LayoutHtmlResponseDto([void updates(LayoutHtmlResponseDtoBuilder b)]) = _$LayoutHtmlResponseDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(LayoutHtmlResponseDtoBuilder b) => b
      ..reconstructionReliable = true;

  @BuiltValueSerializer(custom: true)
  static Serializer<LayoutHtmlResponseDto> get serializer => _$LayoutHtmlResponseDtoSerializer();
}

class _$LayoutHtmlResponseDtoSerializer implements PrimitiveSerializer<LayoutHtmlResponseDto> {
  @override
  final Iterable<Type> types = const [LayoutHtmlResponseDto, _$LayoutHtmlResponseDto];

  @override
  final String wireName = r'LayoutHtmlResponseDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    LayoutHtmlResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'html';
    yield serializers.serialize(
      object.html,
      specifiedType: const FullType(String),
    );
    yield r'reconstructionReliable';
    yield serializers.serialize(
      object.reconstructionReliable,
      specifiedType: const FullType(bool),
    );
    if (object.unreliableReason != null) {
      yield r'unreliableReason';
      yield serializers.serialize(
        object.unreliableReason,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    LayoutHtmlResponseDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required LayoutHtmlResponseDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'html':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.html = valueDes;
          break;
        case r'reconstructionReliable':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.reconstructionReliable = valueDes;
          break;
        case r'unreliableReason':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.unreliableReason = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  LayoutHtmlResponseDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = LayoutHtmlResponseDtoBuilder();
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

